// chakraUtils.js

const chakraData = require('./ChakraData');

function margaNumberChakra(number){

    const chakraInfo = chakraData[number];
    const title = chakraInfo.title;
    return title;
}

function getChakraInfo(roots) {
    const ageRanges = ["0-27", "27-54", "54-81+"];
    const result = [];

    ageRanges.forEach((ageRange, index) => {
        const chakraNumber = roots[index];
        const chakraInfo = chakraData[chakraNumber];

        if (!chakraInfo) {
            throw new Error(`Invalid chakra number provided for index ${index}.`);
        }

        const title = chakraInfo.title;
        const description = chakraInfo.descriptions[ageRange];
        const image = chakraInfo.image;

        result.push({
            ageRange,
            title,
            description,
            image
        });
    });

    return result;
}

module.exports = {
    getChakraInfo,
    margaNumberChakra
};
