/**
 * Returns boolean indicating success
 * Stores an object in a txt file named whatever is in the object's Name property
 * @param {NS} ns
 * @param {object} object - The object being written to a txt file (requires Name property)
 */
export async function Write(ns, object)
{
	try
	{
		let fileName = `/Hax/${object.Name}.txt`;
		let str = JSON.stringify(object);
		ns.write(fileName, str, "w");

		await Index(ns, fileName);
		return true;
	}
	catch (error)
	{
		return false;
	}
}

/**
 * Returns the object stored in a txt file
 * @param {NS} ns
 * @param {string} name - Name of the txt file being read, and the Name property on the object being returned
 * @returns Promise<object>
 */
export async function Read(ns, name)
{
	let str = ns.read(`/Hax/${name}.txt`);
	if (str)
	{
		return JSON.parse(str);
	}
	
	return null;
}

async function Index(ns, name)
{
	let index = await Read(ns, "Index");
	if (index == null)
	{
		index = [];
	}

	if (!index.includes(name))
	{
		index.push(name);
		let str = JSON.stringify(index);
		ns.write("/Hax/Index.txt", str, "w");
	}
}