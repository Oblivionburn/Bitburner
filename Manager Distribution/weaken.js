/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	var securityLevel = ns.getServerSecurityLevel(server);
	var minSecurityLevel = ns.getServerMinSecurityLevel(server);

	if (securityLevel > minSecurityLevel)
	{
		await ns.weaken(server);
	}
}