const fetch = require('node-fetch');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const serverKey = 'exampleServerKey'; // Your server key, can be found in private server settings
const baseURL = 'https://api.policeroleplay.community/v1/'; // Base URL, can be found in https://apidocs.policeroleplay.community/for-developers/api-reference
let ssdDelay = 30; // Change the amount of seconds to check join logs during SSD (default 30, be careful of rate limit)

if (serverKey === 'exampleServerKey') {
  return console.error("You've started the automation for the first time! Please set your server key in line 5 of index.js.");
}

async function fetchCommandLogs() {
  try {
    const response = await fetch(`${baseURL}server/commandlogs`, {
      headers: { 'Server-Key': serverKey }
    });

    if (response.status === 422) {
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      if (rateLimitReset) {
        const resetTime = (parseInt(rateLimitReset, 10) * 1000) - Date.now() + 1000;
        if (typeof ssdDelay === 'undefined' || resetTime > ssdDelay) {
          ssdDelay = resetTime;
          console.warn("Update line 7, too frequent checking.");
        }
        console.error(`Private server is shut down (there are no players), retrying after rate limit reset in ${resetTime / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, resetTime));
      } else {
        console.error("Private server is shut down (there are no players), unable to proceed with automation. Retrying...");
        await new Promise(resolve => setTimeout(resolve, 30 * 1000));
      }
      return fetchJoinLogs();
    }

    if (response.status === 403) {
      return console.error("Invalid server key.");
    }

    if (response.status === 500) {
      return console.error("There was a problem communicating with Roblox.");
    }
    
    if (!response.ok) {
      return console.error(`Error: ${response.statusText}`);
    }

    const commandLogs = await response.json();
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    return { commandLogs, rateLimitRemaining, rateLimitReset };
  } catch (error) {
    console.error('Error fetching command logs:', error);
    throw error;
  }
}

async function fetchPlayers() {
  try {
    const response = await fetch(`${baseURL}server/players`, {
      headers: { 'Server-Key': serverKey }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const playerLogs = await response.json();
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    return { playerLogs, rateLimitRemaining, rateLimitReset };
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
}

async function executeCommand(command) {
  try {
    const response = await fetch(`${baseURL}server/command`, {
      method: 'POST',
      headers: {
        'Server-Key': serverKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command })
    });

    if (!response.ok) {
      throw new Error(`Error executing command: ${response.statusText}`);
    }

    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    return { rateLimitRemaining, rateLimitReset };
  } catch (error) {
    console.error(`Error executing command "${command}":`, error);
    throw error;
  }
}

async function checkCommandLogs() {
  try {
    const { commandLogs, rateLimitReset: rateLimitReset1 } = await fetchCommandLogs();
    const resetTime1 = (parseInt(rateLimitReset1, 10) * 1000) - Date.now() + 1000;

    await new Promise(resolve => setTimeout(resolve, resetTime1));

    const { playerLogs: players, rateLimitReset: rateLimitReset2 } = await fetchPlayers();
    const resetTime2 = (parseInt(rateLimitReset2, 10) * 1000) - Date.now() + 1000;

    await new Promise(resolve => setTimeout(resolve, resetTime2));

    for (const [index, log] of commandLogs.entries()) {
      const { Player, Command } = log;
      const playerName = Player.split(':')[0];
      const playerId = Player.split(':')[1];

      if (await db.get(`${playerId}`)) {
        continue;
      }

      if (/^(:ban all|:unmod all|:mod all|:unadmin all|:admin all)$/i.test(Command)) {
        try {
          const player = players.find(p => p.Player.split(':')[1] === playerId);

          if (player) {
            const { Permission } = player;

            if (Permission === 'Server Administrator') {
              const { rateLimitReset: rateLimitReset3 } = await executeCommand(`:unadmin ${playerId}`);
              const resetTime3 = (parseInt(rateLimitReset3, 10) * 1000) - Date.now() + 1000;
              await db.set(`${playerId}`, true);

              console.log(`Executed :unadmin on player with ID ${playerId} who used the command: ${Command}`);
              await new Promise(resolve => setTimeout(resolve, resetTime3));
            } else if (Permission === 'Server Moderator') {
              const { rateLimitReset: rateLimitReset3 } = await executeCommand(`:unmod ${playerId}`);
              const resetTime3 = (parseInt(rateLimitReset3, 10) * 1000) - Date.now() + 1000;
              await db.set(`${playerId}`, true);
              
              console.log(`Executed :unmod on player with ID ${playerId} who used the command: ${Command}`);
              await new Promise(resolve => setTimeout(resolve, resetTime3));
            }
          }
        } catch (commandError) {
          console.error(`Error executing unmod/unadmin command:`, commandError);
        }
      }

      if (/^:kick all$/i.test(Command)) {
        let foundDownMessage = false;
        for (let i = 1; i <= 5; i++) {
          if (index - i < 0) break;
          const previousLog = commandLogs[index - i];
          if (/^(:h|:m)/i.test(previousLog.Command) && /down/i.test(previousLog.Command)) {
            foundDownMessage = true;
            break;
          }
        }

        if (!foundDownMessage) {
          try {
            const player = players.find(p => p.Player.split(':')[1] === playerId);

            if (player) {
              const { Permission } = player;

              if (Permission === 'Server Administrator') {
                const { rateLimitReset: rateLimitReset3 } = await executeCommand(`:unadmin ${playerId}`);
                const resetTime3 = (parseInt(rateLimitReset3, 10) * 1000) - Date.now() + 1000;
                await db.set(`${playerId}`, true);

                console.log(`Executed :unadmin on player with ID ${playerId} who used the command: ${Command}`);
                await new Promise(resolve => setTimeout(resolve, resetTime3));
              } else if (Permission === 'Server Moderator') {
                const { rateLimitReset: rateLimitReset3 } = await executeCommand(`:unmod ${playerId}`);
                const resetTime3 = (parseInt(rateLimitReset3, 10) * 1000) - Date.now() + 1000;
                await db.set(`${playerId}`, true);

                console.log(`Executed :unmod on player with ID ${playerId} who used the command: ${Command}`);
                await new Promise(resolve => setTimeout(resolve, resetTime3));
              }
            }
          } catch (commandError) {
            console.error(`Error executing unmod/unadmin command:`, commandError);
          }
        }
      }
    }

    checkCommandLogs();
  } catch (error) {
    console.error('Error in checkCommandLogs:', error);
    setTimeout(checkCommandLogs, 30 * 1000);
  }
}

checkCommandLogs();
