const fs = require('fs');

const files = [
  'apps/slot-booking/src/components/batch-editor-screen.tsx',
  'app/src/components/batch-editor-screen.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove totalSlotsWanted and totalSlots from BatchFormState
    content = content.replace(/totalSlotsWanted:\s*string;\n\s*/, '');
    content = content.replace(/totalSlots:\s*string;\n\s*/, '');
    
    // Remove from emptyFormState
    content = content.replace(/totalSlotsWanted:\s*'',\n\s*/, '');
    content = content.replace(/totalSlots:\s*'',\n\s*/, '');
    
    // Remove from formState init
    content = content.replace(/totalSlotsWanted:\s*'',\n\s*/, '');
    content = content.replace(/totalSlots:\s*data\.total_slots \? String\(data\.total_slots\) : '',\n\s*/, '');
    
    // Update generateSlotsPayload signature
    content = content.replace(/,\n\s*totalSlotsWantedStr = ''/, '');
    
    // Remove totalWanted logic
    content = content.replace(/const totalWanted = parseInt\(totalSlotsWantedStr, 10\);\n\s*const hasTotalWanted = !isNaN\(totalWanted\) && totalWanted > 0;\n\s*/, '');
    content = content.replace(/\/\/ If they specified how many slots they want.*?\n\s*if \(hasTotalWanted\) {[\s\S]*?}\n/, '');
    content = content.replace(/if \(hasTotalWanted && generated\.length >= totalWanted\) {\n\s*return generated;\n\s*}\n\s*/g, '');
    content = content.replace(/if \(hasTotalWanted && generated\.length >= totalWanted\) {\n\s*break;\n\s*}\n\s*/, '');
    
    // Update generateSlotsPayload call
    content = content.replace(/,\n\s*formState\.totalSlotsWanted/g, '');
    
    // Enforce 30 days limit
    content = content.replace(
      /if \(slotDurationMinutes <= 0\) return \[\];\n/,
      "if (slotDurationMinutes <= 0) return [];\n\n    const start = new Date(startDateStr);\n    const end = new Date(endDateStr);\n    if (Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) > 30) {\n      throw new Error('Batch date range cannot exceed 30 days.');\n    }\n"
    );
    
    // Fix error handling in handleSubmit to catch the 30 day error
    content = content.replace(
      /const generatedSlots = generateSlotsPayload\(/,
      "let generatedSlots: any[] = [];\n      try {\n        generatedSlots = generateSlotsPayload("
    );
    
    content = content.replace(
      /if \(generatedSlots\.length === 0\) {/,
      "} catch (err: any) {\n        setSaveError(err.message);\n        setSaving(false);\n        return;\n      }\n\n      if (generatedSlots.length === 0) {"
    );
    
    fs.writeFileSync(file, content);
  }
});
