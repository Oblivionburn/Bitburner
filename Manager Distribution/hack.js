/*
	Extracts money from a server
	RAM Cost: 1.85GB
*/

/** @param {NS} ns */
export async function main(ns)
{
    var server = ns.args[0];

    var hackLevel = ns.getHackingLevel();
    var requiredHackLevel = ns.getServerRequiredHackingLevel(server);

    if (hackLevel >= requiredHackLevel)
    {
        await ns.hack(server);
    }
}