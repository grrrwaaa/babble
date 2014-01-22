
var consonants = [
	"b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "y", "z", 
	"ph", "th", "gh", "sh", "ch", "kk", "ng", "qu", "zh", "gn"
];

var vowels = [
	"a", "e", "i", "o", "u", "ae", "ai", "ao", "au", "ay", "ea", "ee", "ei", "eu", "ie", "io", "iu", "oa", "oi", "oo", "ou", "ya", "ye", "yo", "yu", 
	"ar", "er", "ir", "or", "ur", "aer", "air", "ear", "eur", "ier", "ior", "iur", "oar", "our"
];

var startings = [
	"a", "aa", "acti", "ae", "aer", "ai", "ana", "ao", "ar", "au", 
	"ba", "bo", "boo", "by", 
	"cen", "cho", "chro", "cla", "co", "coa", "coi", 
	"de", "digi", "dri", 
	"e", "ea", "ear", "ei", "enve", "eu", 
	"fa", "fee", "fi", "fla", "fri", 
	"hi", 
	"i", "in", "ir", 
	"le", "lo",  
	"ma", "maxi", "medi", "mega", "mi", "mini", "mo", 
	"na", "ne", "nega", 
	"o", "omni", "opto", "or", "osci", "ou",
	"para", "pea", "pha", "pi", "pli", "pro", "pu",
	"ra", "re", "redu", 
	"satu", "see", "sha", "so", "spa", "spe", "sta", "ste", "sy", 
	"te", "thra", "thri", "tri", "tu", 
	"u", "ur", 
	"vi", "voi", 
	"wa", "we", "wi", 
];

var vendings = [
	"back", "be", "bes", "bot", 
	"ces", "ch", "chre", "cial", "cian", "ck", "cker", "ction", 
	"dom", "dome", "don", "drone", "dth", "dy", 
	"fication", "form", "fresh", "ft", "fy", 
	"ges", "gh", "ghst", "ght", "glo", "go", "gan", "gon", "gram", 
	"ja", "jam", "jo", 
	"k", "ker", 
	"lay", "ld", "lk", "llator", "ller", "lo", "lobe", "log", "lope", "lour", "lst", "lter", 
	"mage", "main", "maker", "man", "mat", "mator", "me", "mium", "mix", "mmer", "mst", "mum", 
	"n", "nal", "nance", "nation", "nc", "nch", "ncy", "nd", "ndom", "nds", "ne", "nes", "ness", "ng", "nge", "ngine", "ngs", "ngual", 
	"ning", "nion", "nk", "nnch", "no", "node", "nos", "notion", 
	"nt", "nter", "nto", 
	"pass", "pe", "pth", "put", 
	"q",
	"r", "rator", "re", "reo", "rich", "rim", "rity", "rl", "rle", "rn", "rm", "ron", "rse", "rt", "rte", "rus", "ry",
	"sc", "se", "sh", "sion", "sium", "sm", "smo", "sn", "son", "ssion", "st", "stab", "stal", 
	"t", "tache", "tal", "tch", "te", "ter", "th", "tier", "tion", "tior", "tode", "ton", "tone", "tor", 
	"tre", "tron", "tten", "tude", "ty", "type", "tzsche", 
	"v", "ve", "vel", "ver", "vert", 
	"x", "xion", "xer", 
	"y", 
	"z",
];

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

var paramname1 = function(parts) {
	var name = "";
	name = name + pick(startings); 	
	for (var i=1; i<parts; i++) {	
		name = name + pick(consonants); 	
		name = name + pick(vowels); 
	}
	name = name + pick(vendings); 	
	return name.toUpperCase();
}

function paramname() {
	if (Math.random() < 0.1) {
		return paramname1(1) + " " + paramname1(1);
	} else {
		return paramname1(Math.floor(Math.random()*3));
	}
}

// used to generate unique variable names:
var unique_id = 0;
function gensym(name) {
	name = name || "var";
	unique_id++;
	return name + unique_id;
}