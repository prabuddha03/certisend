const { google } = require("googleapis");
const path = require("path");

class GoogleAuthManager {
  constructor() {
    try {
      const keyPath = path.join(
        __dirname,
        "../config/service-account-key.json"
      );

      // Verify the key file exists
      if (!require("fs").existsSync(keyPath)) {
        throw new Error(`Service account key file not found at: ${keyPath}`);
      }

      // Log the path being used
      console.log("Using service account key from:", keyPath);

      this.auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: [
          "https://www.googleapis.com/auth/forms.body.readonly",
          "https://www.googleapis.com/auth/forms.responses.readonly",
          "https://www.googleapis.com/auth/forms",
          "https://www.googleapis.com/auth/drive.readonly",
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive",
        ],
      });

      // Verify the auth setup immediately
      this.verifyAuth();
    } catch (error) {
      console.error("Error initializing Google Auth:", error);
      throw error;
    }
  }

  async verifyAuth() {
    try {
      const client = await this.auth.getClient();
      console.log("Service Account Email:", client.email);
      console.log("Authentication verified successfully");
    } catch (error) {
      console.error("Auth verification failed:", error);
      throw error;
    }
  }

  async getFormsClient() {
    try {
      const authClient = await this.auth.getClient();
      console.log("Successfully obtained auth client");

      const formsClient = google.forms({
        version: "v1",
        auth: authClient,
      });
      console.log("Successfully created forms client");

      return formsClient;
    } catch (error) {
      console.error("Error getting forms client:", error);
      throw error;
    }
  }
}

module.exports = new GoogleAuthManager();
