const matrix = require('matrix-bot-sdk')

const RichReply = matrix.RichReply;
const MatrixClient = matrix.MatrixClient;
const SimpleFsStorageProvider = matrix.SimpleFsStorageProvider;

let fuzisup = false
let open_ts = undefined
let open_event = undefined

// where you would point a client to talk to a homeserver
const homeserverUrl = "https://matrix.fuz.re";

// see https://t2bot.io/docs/access_tokens
const accessToken = process.env.ACCESS_TOKEN || process.exit(1);

// We'll want to make sure the bot doesn't have to do an initial sync every
// time it restarts, so we need to prepare a storage provider. Here we use
// a simple JSON database.
const storage = new SimpleFsStorageProvider("fuzisup-bot.json");

// Now we can create the client and set it up to automatically join rooms.
const client = new MatrixClient(homeserverUrl, accessToken, storage);

// We also want to make sure we can receive events - this is where we will
// handle our command.
client.on("room.message", handleCommand);

// Now that the client is all set up and the event handler is registered, start the
// client up. This will start it syncing.
client.start().then(() => console.log("Client started!"));

// This is our event handler for dealing with the `!hello` command.
async function handleCommand(roomId, event) {
    // Don't handle events that don't have contents (they were probably redacted)
    if (!event["content"]) return;

    // Don't handle non-text events
    if (event["content"]["msgtype"] !== "m.text") return;

    // We never send `m.text` messages so this isn't required, however this is
    // how you would filter out events sent by the bot itself.
    if (event["sender"] === await client.getUserId()) return;

    // Make sure that the event looks like a command we're expecting
    const body = event["content"]["body"];
    if (!body) return;

    if (body.startsWith("!open")) {
        fuzisup = true
        open_event = event
        open_ts = new Date()

        const replyBody = "FUZ now OPEN!";
        
        const reply = {
            "msgtype": "m.notice",
            "body": replyBody,
            "format": "org.matrix.custom.html",
            "formatted_body": `<h3>${replyBody}</h3>`,
        };

        client.sendMessage(roomId, reply);
    } else if (body.startsWith("!close")) {
        fuzisup = false

        const replyBody = "FUZ now CLOSED!";

        const reply = {
            "msgtype": "m.notice",
            "body": replyBody,
            "format": "org.matrix.custom.html",
            "formatted_body": `<h3>${replyBody}</h3>`,
        };

        client.sendMessage(roomId, reply);
    } else if (body.startsWith("!up?")) {
        if (open_ts != undefined && open_ts > (Date.now() - 8 * 3600 * 1000 * 1000) && fuzisup && open_event != undefined) {
            const replyBody = `Yes, come join us! (Since ${open_ts.toLocaleTimeString()})`;

            const reply = RichReply.createFor(roomId, open_event, replyBody, `<h3>${replyBody}</h3>`);
            reply["msgtype"] = "m.notice";
            client.sendMessage(roomId, reply);
        } else {
            const replyBody = "No, check later!";

            const reply = {
                "msgtype": "m.notice",
                "body": replyBody,
                "format": "org.matrix.custom.html",
                "formatted_body": `<h3>${replyBody}</h3>`,
            };

            client.sendMessage(roomId, reply);
        }
    }
}