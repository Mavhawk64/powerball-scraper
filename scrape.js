const apify = require('apify');
const fs = require('fs');
const MAX_WHITE = 69; //nice
const MAX_RED = 26;

const {main, launchPuppeteer} = apify;
const {createWriteStream} = fs;

var file = createWriteStream('powerball2d.txt');

var math1 = createWriteStream('whiteballs.txt');
var math2 = createWriteStream('redballs.txt');
var math = createWriteStream('bothballs.txt');

let nums = [];
let powerBall = [];
let pageNum = 1;

main(async () => {
    const browser = await launchPuppeteer({ stealth: true });
    const page = await browser.newPage();
    for (let i = 0; i < 119; i++) {
    await page.goto('https://www.usamega.com/powerball/results/'+pageNum);
    const liTags = await page.$$eval('li', (list) => list.map((elm) => elm.textContent));

    for(let i = 0; i < liTags.length; i++) {
        if(!liTags[i].includes('x') && parseInt(liTags[i])) {
            nums.push(parseInt(liTags[i]));
        }
    }
    pageNum++;
}    
    await page.close();
    await browser.close();
    notYet();
});

function notYet() {
    powerBall = [];
    let notPowerBall = [];
for (let i = 5; i < nums.length; i += 6) {
    powerBall.push(nums[i]);
}

for(let i = 0; i < nums.length; i++) {
    if((i+1) % 6 != 0) {
        notPowerBall.push(nums[i]);
    }
}

console.log(nums);
console.log(notPowerBall);
console.log(powerBall);
writeMyFile();
let x = powerBall; //Set local copy
doMyMath(notPowerBall, x);
}

function doMyMath(white, red) {
    //white - array of non-powerballs (1-69)
    //red - array of powerballs (1-26)
    let wa = [];
    for(let i = 1; i <= MAX_WHITE; i++) {
        let c = countItems(white, i);
        wa.push(c);
    }
    let ra = [];
    for(let i = 1; i <= MAX_RED; i++) {
        let c = countItems(red, i);
        ra.push(c);
    }

    console.log(ra);

    //Make new arrays with: TOP 5 White, BOTTOM 5 White, TOP Red, BOTTOM Red
    let top5 = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]; //[index, amount]
    let bot5 = [[0, 100], [0, 100], [0, 100], [0, 100], [0, 100]]; //[index, amount]
    let top = [0,0];
    let bot = [100,100];
    //-----------RED TOP AND BOTTOM LOOPS------------
    for(let i = 0; i < ra.length; i++) {
        if(top[1] < ra[i]) {
            top[1] = ra[i];
            top[0] = i;
            i = -1;
        }
    }

    for(let i = 0; i < ra.length; i++) {
        if (bot[1] > ra[i]) {
            bot[1] = ra[i];
            bot[0] = i;
            i = -1;
        }
    }

//---------------WHITE TOP AND BOTTOM LOOPS-------------
    for(let i = 0; i < wa.length; i++) {
        if(top5[0][1] < wa[i]) {
            top5[0][1] = wa[i];
            top5[0][0] = i;
            i = -1;
        } else {
            for(let j = 1; j < top5.length; j++) {
                if(top5[j][1] < wa[i] && top5[j-1][1] > wa[i]) {
                    top5[j][1] = wa[i];
                    top5[j][0] = i;
                    i = -1;
                    break;
                }
            }
        }
    }
    
    for(let i = 0; i < wa.length; i++) {
        if (bot5[0][1] > wa[i]) {
            bot5[0][1] = wa[i];
            bot5[0][0] = i;
            i = -1;
        } else {
            for(let j = 1; j < bot5.length; j++) {
                if(bot5[j][1] > wa[i] && bot5[j-1][1] < wa[i]) {
                    bot5[j][1] = wa[i];
                    bot5[j][0] = i;
                    i = -1;
                    break;
                }
            }
        }
    }


    //Write the arrays to the file.

    let s = "----------WHITE NUMBERS FROM POWERBALL----------\n" +
            "---------------------TOP 5----------------------\n";
    for(let i = 0; i < top5.length; i++) {
        s += top5[i][0] + " appeared " + top5[i][1] + " times\n";
    }
    s += "--------------------BOTTOM 5--------------------\n";
    for(let i = 0; i < bot5.length; i++) {
        s += bot5[i][0] + " appeared " + bot5[i][1] + " times\n";
    }

    math1.on('error', function() { console.log("ERROR OCURRED IN WRITING FILE IN MATH1");});
    math1.write(s);
    math1.end();
    let d = "---------TOP RED NUMBER FROM POWERBALL---------\n";
    d += top[1] + " appeared " + top[0] + " times\n";
    d += "-------BOTTOM RED NUMBER FROM POWERBALL--------\n";
    d += bot[1] + " appeared " + bot[0] + " times\n";

    math2.on('error', function () { console.log("ERROR OCURRED IN WRITING FILE IN MATH1"); });
    math2.write(d);
    math2.end();

    s +=    "---------TOP RED NUMBER FROM POWERBALL---------\n";
    s += top[0] + " appeared " + top[1] + " times\n";
    s +=    "-------BOTTOM RED NUMBER FROM POWERBALL--------\n";
    s += bot[0] + " appeared " + bot[1] + " times\n";


    console.log(s);

    math.on('error', function () { console.log("ERROR OCURRED IN WRITING FILE IN MATH1"); });
    math.write(s);
    math.end();




}

function writeMyFile() {

    file.on('error', function () { console.log("ERROR OCURRED IN WRITING FILE"); });
    //total.forEach(function (v) { file.write(v.join(', ') + '\n'); });

    let s = "[";

    for (let i = 0; i < nums.length; i++) {
        s += ((i + 1) % 6 == 1 ? "[" : "") + nums[i] + ((i + 1) % 6 == 0 ? (i + 1 == nums.length ? "]]" : "],\n") : ", ");
    }

    console.log("My Stringified Numbers: " + s);

    file.write(s);

    file.end();

}

function countItems(arr, what) {
    var count = 0, i;
    while ((i = arr.indexOf(what, i)) != -1) {
        count++;
        i++;
    }
    return count;
}