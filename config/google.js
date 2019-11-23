const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'config/token.json';

fs.readFile('config/credentials.js', (err,content) => {
    if(err) throw err;
    authorize(JSON.parse(content), listEvents);
});

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err,token) => {
        if(err) return getAccessToken(oAuth2Client, callback);
        callback(oAuth2Client);
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log("Authorize by visiting: "+authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Enter the code from that page: ", (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err,token) => {
            if(err) throw err;
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if(err) throw err;
                console.log("Token path: "+TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function listEvents(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
    }, (err,res) => {
        if(err) throw err;
        const events = res.data.items;
        if(events.length) {
            console.log("Upcoming 10 events:");
            events.map((event, i) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${start} - ${event.summary}`);
            });
        } else {
            console.log("No events");
        }
    });
}