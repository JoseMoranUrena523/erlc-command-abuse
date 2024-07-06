# ER:LC Command Abuse

## What is this?
This automation detects when a server moderator/server administrator does a very dangerous command (such as :kick all, :ban all, :mod all, :unmod all, :admin all, or :unadmin all) and unmods that moderator/administrator. (interval cannot be updated due to rate limits).

## Why is this useful?
This makes sure that the moderator/administrator cannot continue causing chaos to your private server (as they have already). This shouldn't be used alone and should be used with a bot such as [Melonly](https://melonly.xyz/) with the command logs system enabled (this isn't a sole system, it's an addition).

## Installation
### Prerequisites
- A private server with the **ERLC API** server pack.
- A VPS (Virtual Private Server) or any machine with Node.js, Git installed, and a stable internet connection to host this script (e.g., Raspberry Pi or dedicated server).

### Installation Steps
1. `git clone https://github.com/JoseMoranUrena523/erlc-command-abuse`
2. `npm install pm2 -g`
3. Edit line 5 of **index.js**.
4. `npm install`
5. `pm2 start index.js`

Using PM2 makes sure that the script keeps running in the background even if you close the terminal or disconnect from the server. Thank you for using this automation!