const axios = require('axios');

// Generate M-Pesa access token
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa access token error:', error.message);
    throw error;
  }
};

// Generate password for STK push
const generatePassword = (shortcode, passkey, timestamp) => {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
};

// Generate timestamp
const generateTimestamp = () => {
  const date = new Date();
  return date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0');
};

// Initiate STK Push
const initiateSTKPush = async (phoneNumber, amount, accountReference, callbackUrl) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(
      process.env.MPESA_SHORTCODE,
      process.env.MPESA_PASSKEY,
      timestamp
    );

    // Format phone number
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: 'Fresh Harvest Grocery Purchase'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage
    };
  } catch (error) {
    console.error('M-Pesa STK Push error:', error.message);
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

// Query STK Push status
const querySTKPushStatus = async (checkoutRequestId) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(
      process.env.MPESA_SHORTCODE,
      process.env.MPESA_PASSKEY,
      timestamp
    );

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      mpesaReceiptNumber: response.data.CallbackMetadata?.Item?.find(
        item => item.Name === 'MpesaReceiptNumber'
      )?.Value
    };
  } catch (error) {
    console.error('M-Pesa query error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Process M-Pesa callback
const processCallback = async (callbackData) => {
  try {
    const resultCode = callbackData.Body?.stkCallback?.ResultCode;
    const resultDesc = callbackData.Body?.stkCallback?.ResultDesc;
    const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;
    
    if (resultCode === 0) {
      const callbackMetadata = callbackData.Body?.stkCallback?.CallbackMetadata?.Item;
      const mpesaReceiptNumber = callbackMetadata?.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata?.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata?.find(item => item.Name === 'PhoneNumber')?.Value;
      const amount = callbackMetadata?.find(item => item.Name === 'Amount')?.Value;

      return {
        success: true,
        checkoutRequestId,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        amount,
        resultDesc
      };
    } else {
      return {
        success: false,
        checkoutRequestId,
        resultCode,
        resultDesc
      };
    }
  } catch (error) {
    console.error('M-Pesa callback processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initiateSTKPush,
  querySTKPushStatus,
  processCallback,
  getAccessToken
};
