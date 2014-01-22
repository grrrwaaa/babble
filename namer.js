
var consonants = [
	"b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "y", "z", 
	"ph", "th", "gh", "sh", "ch", "kk", "ng", "qu", "zh", "gn"
];

var vowels = [
	"a", "e", "i", "o", "u", 
	"ae", "ai", "ao", "au", "ay", "ea", "ee", "ei", "eu", "ie", "io", "iu", "oa", "oi", "oo", "ou", 
	"ya", "ye", "yo", "yu", 
	"ar", "er", "ir", "or", "ur", 
	//"aer", "air", "ear", "eur", "ier", "ior", "iur", "oar", "our"
];

var startings = [
	"a", "aa", "acti", "ae", "aer", "ai", "ana", "ano", "anti", "ao", "ar", "au", 
	"ba", "bo", "boo", "by", 
	"cen", "cho", "cha", "chro", "cla", "co", "coa", "coi", "cry", 
	"de", "digi", "dio", "do", "dri", 
	"e", "ea", "ear", "ei", "ele", "enve", "eu", 
	"fa", "fee", "fi", "fla", "for", "free", "fri", 
	"gi", "gra", 
	"hi", 
	"i", "in", "inter", "ir", 
	"le", "lo",  
	"ma", "medi", "mega", "mi", "mo", 
	"na", "ne", "nega", "no", 
	"o", "omni", "opto", "or", "orbi", "orga", "osci", "ou",
	"para", "pea", "pha", "phase", "pi", "pli", "pri", "pro", "pu",
	"ra", "re", "redu", "resi", 
	"satu", "see", "sha", "shi", "so", "spa", "spe", "sta", "ste", "sy", 
	"te", "thra", "thri", "thu", "tra", "tri", "tu", 
	"u", "ur", 
	"ve", "vi", "voi", 
	"wa", "we", "wi", 
];

var vendings = [
	"back", "bank", "be", "beha", "bes", "bone", "bot", 
	"ces", "ch", "chon", "chre", "cial", "cian", "citor", "city", "ck", "cker", "ction", "ctor",
	"de", "dom", "dome", "don", "drone", "dth", "dule", "dy", 
	"faction", "ffer", "fication", "flix", "form", "fract", "ft", "fy", 
	"ges", "gh", "ghst", "ght", "glo", "gner", "go", "gan", "gon", "gram", 
	"hand", "hex", "hive", 
	"ja", "jack", "jam", "jo", "ju",
	"k", "ker", "ki", "klang", "knot", "ku", 
	"lange", "lay", "ld", "le", "let", "lix", "lk", "llator", "ller", "lo", "load", "lobe", "lode", "log", "lope", "lour", "lst", "lter", 
	"mage", "main", "maker", "man", "mancy", "mant", "mat", "mator", "me", 
	"mic", "ming", "mion", "mium", "mix", "mmer", "mst", "mum", 
	"n", "nal", "nance", "nation", "nc", "nch", "ncy", "nd", "ndom", "nds", "ne", "nes", "ness", "ng", "nge", "ngine", "ngs", "ngual", 
	"nics", "ning", "nion", "nk", "nnch", 
	"no", "node", "non", "norm", "nos", "notion", "nout", "nst", 
	"nt", "nts", "nter", "nto", 
	"pass", "pe", "phax", "phics", "pth", "put", 
	"q",
	"r", "rach", "rasm", "rath", "rator", "rce", "re", "rella", "rence", "reo", "rial", "rich", "rim", "rish", "rity", "rix", "rl", "rle", "rn", "rm", "ron", "rse", "rt", "rte", "rus", "ry",
	"sc", "scape", "se", "sh", "shub", "sion", "sium", "sm", "smo", "sn", "son", "ssion", "st", "stack", "stal", "stan", "state", "step", "stor", 
	"t", "tache", "tal", "tch", "te", "ter", "th", "tier", "tion", "tior", "tler", "tode", "tome", "ton", "tone", "tor", 
	"tre", "tron", "tten", "tude", "ty", "type", "tzsche", 
	"v", "vat", "vator", "ve", "vel", "ver", "vert", "viour",
	"x", "xion", "xer", 
	"y", 
	"z", "zex", "zone", 
];

function pick(arr) {
	return arr[Math.floor(random() * arr.length)];
}

var paramname1 = function(parts) {
	var name = "";
	if (random() < 0.5) {
		name = name + pick(startings); 	
	} else {
		name = name + pick(vowels);
	}
	for (var i=1; i<parts; i++) {	
		name = name + pick(consonants); 	
		name = name + pick(vowels); 
	}
	name = name + pick(vendings); 	
	return name.toUpperCase();
}

function paramname() {
	if (random() < 0.1) {
		return paramname1(1) + " " + paramname1(1);
	} else {
		return paramname1(Math.floor(random()*3));
	}
}

// used to generate unique variable names:
var unique_id = 0;
function gensym(name) {
	name = name || "var";
	unique_id++;
	return name + unique_id;
}