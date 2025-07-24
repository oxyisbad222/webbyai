// /api/proxy.js

// This function will run on Vercel's servers, not in the browser.
// It acts as a backend proxy to securely communicate with the Browserbase API.

export default async function handler(req, res) {
    // Extract the target path from a custom header sent by the frontend.
    const targetPath = req.headers['x-target-path'];
    if (!targetPath) {
        return res.status(400).json({ message: 'x-target-path header is required.' });
    }
    const browserbaseApiUrl = `https://api.browserbase.com/v1${targetPath}`;

    // Set CORS headers to allow requests from your Vercel deployment.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-target-path');

    // Respond to preflight CORS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // The API key is securely read from Vercel's environment variables
        // on the server-side, instead of being passed from the client.
        const apiKey = process.env.BROWSERBASE_API_KEY;

        // --- DEBUGGING STEP ---
        // This will help us confirm if the Vercel function is accessing the environment variable.
        if (apiKey) {
            console.log("Successfully accessed BROWSERBASE_API_KEY. Key starts with:", apiKey.substring(0, 5));
        } else {
            console.error("CRITICAL: BROWSERBASE_API_KEY environment variable is NOT SET or is empty.");
            return res.status(500).json({ message: 'Server configuration error: BROWSERBASE_API_KEY is not set.' });
        }
        // --- END DEBUGGING STEP ---

        // Forward the request from the frontend to the Browserbase API.
        const response = await fetch(browserbaseApiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'x-bb-api-key': apiKey,
            },
            body: req.body ? JSON.stringify(req.body) : null,
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error from Browserbase API:", errorData);
            return res.status(response.status).send(errorData);
        }
        
        if (response.status === 204) { // No Content
            return res.status(204).end();
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Error in proxy function:', error);
        res.status(500).json({ message: 'An error occurred in the proxy server.' });
    }
}
