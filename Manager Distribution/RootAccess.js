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
		var portsOpened = 0;
		if (portsRequired >= 5 &&
			canSQLInject)
		{
			portsOpened++;
			ns.sqlinject(server);
		}
		if (portsRequired >= 4 &&
			canHTTPWorm)
		{
			portsOpened++;
			ns.httpworm(server);
		}
		if (portsRequired >= 3 &&
			canRelaySMTP)
		{
			portsOpened++;
			ns.relaysmtp(server);
		}
		if (portsRequired >= 2 &&
			canFTPCrack)
		{
			portsOpened++;
			ns.ftpcrack(server);
		}
		if (portsRequired >= 1 &&
			canBruteSSH)
		{
			portsOpened++;
			ns.brutessh(server);
		}

		if (portsOpened >= portsRequired)
		{
			ns.nuke(server);

			//Send alert to Terminal
			ns.tprint("Gained root access to '" + server + "' server!");
		}
		
		hasRoot = ns.hasRootAccess(server);
	}

	return hasRoot;
}