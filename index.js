import fetch from 'node-fetch';

const serverKey = 'exampleServerKey'; // Your server key, can be found in private server settings
const baseURL = 'https://api.policeroleplay.community/v1/'; // Base URL, can be found at https://apidocs.policeroleplay.community/for-developers/api-reference
const interval = 6; // How often to check command logs (DO NOT CHANGE, RATE LIMIT)

if (serverKey === 'exampleServerKey') {
  return console.error("You've started the automation for the first time! Please set your server key in line 3 of index.js. You can also modify the interval, PRC's base URL, or the join message with lines 4 and 5.");
}

async function checkCommandLogs() {
  try {
    const response = await fetch(`${baseURL}server/commandlogs`, {
      headers: { 
        'Server-Key': serverKey
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const commandLogs = await response.json();

    const playersResponse = await fetch(`${baseURL}server/players`, {
      headers: { 
        'Server-Key': serverKey
      }
    });

    if (!playersResponse.ok) {
      throw new Error(`Error: ${playersResponse.statusText}`);
    }

    const players = await playersResponse.json();

    for (const log of commandLogs) {
      const { Player, Command } = log;
      const playerName = Player.split(':')[0];
      const playerId = Player.split(':')[1];

      if (/^(:ban all|:unmod all|:mod all|:jail all|:admin all|:unadmin all)$/i.test(Command)) {
        try {
          const player = players.find(p => p.Player.split(':')[1] === playerId);

          if (player) {
            const { Permission } = player;

            if (Permission === 'Server Administrator') {
              await fetch(`${baseURL}server/command`, {
                method: 'POST',
                headers: { 
                  'Server-Key': serverKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  command: `:unadmin ${playerId}`
                })
              });

              console.log(`Executed :unadmin on player with ID ${playerId} who used the command: ${Command}`);
            } else if (Permission === 'Server Moderator') {
              await fetch(`${baseURL}server/command`, {
                method: 'POST',
                headers: { 
                  'Server-Key': serverKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  command: `:unmod ${playerId}`
                })
              });

              console.log(`Executed :unmod on player with ID ${playerId} who used the command: ${Command}`);
            }
          }
        } catch (commandError) {
          console.error(`Error executing unmod/unadmin command:`, commandError);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching command logs:', error);
  }
}

setInterval(checkCommandLogs, interval * 1000);
