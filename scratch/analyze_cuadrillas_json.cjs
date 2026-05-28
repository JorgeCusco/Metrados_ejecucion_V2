const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Legion\\Downloads\\cuadrillas_export.json', 'utf8'));

console.log("TOP LEVEL KEYS (Specialties):", Object.keys(data));

let totalWorkers = 0;
const specialtyCounts = {};
const cuadrillaCounts = {};

for (const specialty in data) {
    specialtyCounts[specialty] = 0;
    for (const cuadrilla in data[specialty]) {
        const workers = data[specialty][cuadrilla];
        specialtyCounts[specialty] += workers.length;
        totalWorkers += workers.length;
        
        const cKey = `${specialty} -> ${cuadrilla}`;
        cuadrillaCounts[cKey] = workers.length;
    }
}

console.log("\nTOTAL WORKERS IN JSON:", totalWorkers);
console.log("\nSPECIALTIES AND THEIR WORKER COUNTS:");
console.log(specialtyCounts);

console.log("\nCUADRILLAS AND THEIR WORKER COUNTS (Sample):");
const cKeys = Object.keys(cuadrillaCounts);
console.log(`Total cuadrillas: ${cKeys.length}`);
cKeys.slice(0, 15).forEach(k => {
    console.log(` - ${k}: ${cuadrillaCounts[k]}`);
});
