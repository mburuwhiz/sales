const verifyMicroservice = (req, res, next) => {
  if (req.body.apiKey !== process.env.MAILER_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized Request. Invalid API Key.' });
  }
  next();
};

module.exports = { verifyMicroservice };
