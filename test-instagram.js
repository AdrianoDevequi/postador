require("dotenv").config();
const axios = require("axios");

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const TARGET_ID = process.env.INSTAGRAM_USER_ID;

async function debugInstagram() {
    console.log("🔍 Debugging Instagram Connection...");
    console.log(`Target ID from .env: ${TARGET_ID}`);
    console.log(`Token from .env: ${TOKEN ? TOKEN.substring(0, 15) + "..." : "MISSING"}`);

    if (!TOKEN || !TARGET_ID) {
        console.error("❌ Missing credentials in .env");
        return;
    }

    try {
        // 1. Check "me/accounts" to see what pages this token has access to
        console.log("\n1️⃣  Checking Linked Pages (me/accounts)...");
        const pagesParams = {
            access_token: TOKEN,
            fields: "name,id,instagram_business_account",
        };
        const pagesRes = await axios.get("https://graph.facebook.com/v22.0/me/accounts", { params: pagesParams });

        console.log("✅ Pages found:", pagesRes.data.data.length);

        let found = false;
        pagesRes.data.data.forEach(page => {
            const connectedInsta = page.instagram_business_account;
            const hasInsta = connectedInsta ? `YES (ID: ${connectedInsta.id})` : "NO";
            console.log(`   - Page: ${page.name} (ID: ${page.id}) | Instagram: ${hasInsta}`);

            if (connectedInsta && connectedInsta.id === TARGET_ID) {
                found = true;
                console.log("   🎯 MATCH! This token HAS access to your Instagram ID.");
            }
        });

        if (!found) {
            console.error("\n❌ FATAL: The token works, but it DOES NOT have access to the Instagram ID in your .env.");
            console.error(`   You are trying to post to: ${TARGET_ID}`);
            console.error("   But the token only sees the accounts listed above.");
            console.error("   SOLUTION: Generate a new token and make sure to select the correct PAGE.");
            return;
        }

        // 2. Check Permissions / Token Debug
        console.log("\n2️⃣  Checking Token Permissions (debug_token)...");
        const debugRes = await axios.get("https://graph.facebook.com/v22.0/debug_token", {
            params: {
                input_token: TOKEN,
                access_token: TOKEN // Self-debug
            }
        });

        const scopes = debugRes.data.data.scopes;
        console.log("✅ Token Scopes:", scopes);

        const required = ["instagram_basic", "instagram_content_publish", "pages_show_list"];
        const missing = required.filter(r => !scopes.includes(r));

        if (missing.length > 0) {
            console.error("❌ MISSING PERMISSIONS:", missing.join(", "));
            console.error("   SOLUTION: Generate a new token and check ALL permissions.");
        } else {
            console.log("✅ All required permissions are present.");
        }

    } catch (error) {
        console.error("\n❌ API ERROR:");
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`   Message: ${error.message}`);
        }
    }
}

debugInstagram();
