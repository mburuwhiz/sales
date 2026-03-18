const AuthState = require('../models/AuthState');
const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

const useMongoDBAuthState = async (collectionName) => {
  const writeData = async (data, id) => {
    const informationToStore = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
    await AuthState.findOneAndUpdate({ id }, { data: informationToStore }, { upsert: true });
  };

  const readData = async (id) => {
    const data = await AuthState.findOne({ id });
    if (!data) return null;
    return JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
  };

  const removeData = async (id) => {
    await AuthState.deleteOne({ id });
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
};

module.exports = { useMongoDBAuthState };
