const axios = require("axios");

module.exports = class GoogleSheet {
    constructor(client) {
        this.client = client;
    }

    async post(data) {
        // console.log(data);
        try {
            const response = await axios.post(this.client.config.google.scriptURL, data, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.status !== 200) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.data}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'employé dans Google Sheets:', error);
        }
    }
}