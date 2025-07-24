// /api/proxy.js

// This function will run on Vercel's servers, not in the browser.
// It acts as a backend proxy to securely communicate with the Browserbase API.

export default async function handler(req, res) {
    // Extract the target path from a custom header sent by the frontend.
    // e.g., '/sessions' or '/sessions/some-id/instructions'
    const targetPath = req.headers['x-target-path'];
    const browserbaseApiUrl = `https://api.browserbase.com/v1${targetPath}`;

    // Set CORS headers to allow requests from your Vercel deployment.
    // IMPORTANT: In production, you should replace '*' with your specific Vercel domain
    // for better security, e.g., 'https://your-project-name.vercel.app'.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-bb-project-id, x-bb-api-key, x-target-path');

    // Respond to preflight CORS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Forward the request from the frontend to the Browserbase API.
        const response = await fetch(browserbaseApiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'x-bb-project-id': req.headers['x-bb-project-id'],
                'x-bb-api-key': req.headers['x-bb-api-key'],
            },
            // Pass the body along if it exists.
            body: req.body ? JSON.stringify(req.body) : null,
        });

        // Check if the request to Browserbase was successful.
        if (!response.ok) {
            // If not, pass the error response back to the frontend.
            const errorData = await response.text();
            console.error("Error from Browserbase API:", errorData);
            return res.status(response.status).send(errorData);
        }

        // Send the successful response from Browserbase back to the frontend.
        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Error in proxy function:', error);
        res.status(500).json({ message: 'An error occurred in the proxy server.' });
    }
}
