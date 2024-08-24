// Function to calculate the digital root of a number
function calculateDigitalRoot(number) {
    let digits = String(number).split('').map(Number); // Convert number to array of digits
    let sum = digits.reduce((acc, digit) => acc + digit, 0); // Calculate the sum of digits

    // Calculate the digital root
    let digitalRoot = sum % 9;
    if (digitalRoot === 0 && sum !== 0) {
        digitalRoot = 9;
    }

    return digitalRoot;
}

// Function to calculate the Marga number
async function calculateMarga(C4, F4, I4) {
    const sum = C4 + F4 + I4;
    const result = sum % 9;
    return result === 0 ? 9 : result;
}

// Function to calculate all numbers based on the date of birth
async function calculateNumber(dob) {
    // Parse the date
    const date = new Date(dob);

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are zero-indexed
    const day = date.getDate();

    // Calculate the digital roots for month, day, and year
    const first = calculateDigitalRoot(month);
    const second = calculateDigitalRoot(day);
    const third = calculateDigitalRoot(year);

    // Calculate Marga number
    const margaNumber = await calculateMarga(Number(first), Number(second), Number(third));
    console.log("Marga Number:", margaNumber);
    // Return the calculated values
    return margaNumber;
}

// Export the functions
module.exports = {
    calculateNumber
};
