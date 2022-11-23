/*
RAM Cost: 2.15 GB
*/

/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	//Which port do we need to open?
	var portsRequired = ns.getServerNumPortsRequired(server);

	var canBruteSSH = ns.fileExists("BruteSSH.exe", "home");
	var canFTPCrack = ns.fileExists("FTPCrack.exe", "home");
	var canRelaySMTP = ns.fileExists("relaySMTP.exe", "home");
	var canHTTPWorm = ns.fileExists("HTTPWorm.exe", "home");
	var canSQLInject = ns.fileExists("SQLInject.exe", "home");

	//Do we already have root access for this server?
	var hasRoot = ns.hasRootAccess(server);
	if (!hasRoot)
	{
		var portOpen = false;

		if (portsRequired == 5 &&
			canSQLInject)
		{
			portOpen = true;
			ns.sqlinject(server);
		}
		else if (portsRequired == 4 &&
				 canHTTPWorm)
		{
			portOpen = true;
			ns.httpworm(server);
		}
		else if (portsRequired == 3 &&
				 canRelaySMTP)
		{
			portOpen = true;
			ns.relaysmtp(server);
		}
		else if (portsRequired == 2 &&
				 canFTPCrack)
		{
			portOpen = true;
			ns.ftpcrack(server);
		}
		else if (portsRequired == 1 &&
				 canBruteSSH)
		{
			portOpen = true;
			ns.brutessh(server);
		}
		else if (portsRequired == 0)
		{
			portOpen = true;
		}

		if (portOpen)
		{
			ns.nuke(server);

			//Send alert to Terminal
			ns.tprint("Gained root access to '" + server + "' server!");
		}
		
		hasRoot = ns.hasRootAccess(server);
	}

	return hasRoot;
}

export function version()
{
    return 1;
}