/** @param {NS} ns */
export async function main(ns)
{
    var server = ns.args[0];

    while(true)
    {
        var hackLevel = ns.getHackingLevel();
        var requiredHackLevel = ns.getServerRequiredHackingLevel(server);

        if (hackLevel >= requiredHackLevel)
        {
            await ns.hack(server);
        }
        else
        {
            await ns.sleep(1);
        }
    }
}