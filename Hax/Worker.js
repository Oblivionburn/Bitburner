/** @param {NS} ns */
export async function main(ns)
{
    var target = ns.args[0];

    while (true)
    {
        var hackLevel = ns.getHackingLevel();
        var requiredHackLevel = ns.getServerRequiredHackingLevel(target);

        var availableMoney = ns.getServerMoneyAvailable(target);
        var maxMoney = ns.getServerMaxMoney(target);

        var securityLevel = ns.getServerSecurityLevel(target);
        var minSecurityLevel = ns.getServerMinSecurityLevel(target);

        if (securityLevel > minSecurityLevel)
        {
            await ns.weaken(target);
        }
        else if (availableMoney < maxMoney)
        {
            await ns.grow(target);
        }
        else if (hackLevel >= requiredHackLevel)
        {
            await ns.hack(target);
        }
        else
        {
            await ns.sleep(1000);
        }
    }
}