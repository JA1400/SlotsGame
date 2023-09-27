const reelList = document.querySelectorAll('.slots #reel-w-light > .reel');
const tableNums = document.querySelectorAll('.multi-win-num');
const musicToggle = document.querySelector('#music-toggle');
const winLights = document.querySelectorAll('.tester-light');
const gameNumDivs = document.querySelectorAll('.game-nums');
const cardScreens = document.querySelectorAll('.cards');
const cardbtns = document.querySelectorAll('.card-btns');
const btns = document.querySelectorAll('.game-btn')
const btn = document.querySelector('#play');
const wLightIn = [0, 0, 0];
const numIcons = 9,
    timePerIcon = 50,
    indexes = [0, 0, 0];
//reel icon sizes
let iconWidth = 84,
    iconHeight = 80,
    iconOffset = -30;
//jackpot // multiplier/bet // winnings // credits 
const gameNumsArr = [100, 1, 0, 10]
let jackpotWin = false;
let lostGame = false;
let isSpinning = false;
let gotResized = false;


/* const iconArray = ['Banana', '7', 'Cherries', 'Plum', 'Orange', 'Bell', 'Bar', 'Lemon', 'Watermelon']; */
const baseWinNums = [gameNumsArr[0], 50, 25, 15, 10, 5, 2];
const sfx = {
    spin: new Howl({
        src: ['sounds/playBtn.mp3']
    }),
    betUp: new Howl({
        src: ['sounds/betUp.mp3']
    }),
    betDown: new Howl({
        src: ['sounds/betDown.mp3']
    }),
    smallWin: new Howl({
        src: ['sounds/smallWin.mp3']
    }),
    bigWin: new Howl({
        src: ['sounds/bigWin.mp3']
    }),
    winLoop: new Howl({
        src: ['sounds/winLoop.m4a'],
        loop: true
    }),
    reelSpin: new Howl({
        src: ['sounds/reelSpin.m4a'],
        loop: true,
        volume: 0.7
    }),
    stopSound: new Howl({
        src: ['sounds/stopSoundTwo.m4a']
    }),
    infoBtn: new Howl({
        src: ['sounds/infoSound.m4a']
    }),
    gameSong: new Howl({
        src: ['sounds/gameLoop.wav'],
        loop: true,
        volume: 0.5
    })
}

const roll = (reel, offset = 0) => {
    const delta = ((offset + 3) * numIcons + Math.floor(Math.random() * numIcons))
    //pulling style from a reel
    const style = getComputedStyle(reel), // getting a number back rather than a string
        backgroundPositionY = parseFloat(style["background-position-y"]),
        targetBackgroundPositionY = backgroundPositionY + delta * iconHeight,
        //devides the new position by the max amount of pixels of the background
        //this will equal to the first position the icon is found in
        normTargetBackgroundPositionY = (targetBackgroundPositionY % (numIcons * iconHeight));
    return new Promise((res) => {
        //animation 
        reel.style.transition = `background-position-y ${8 + delta * timePerIcon}ms cubic-bezier(.39,-0.06,.57,1.07)`;
        //position
        reel.style.backgroundPositionY = `${targetBackgroundPositionY}px`;

        setTimeout(() => {
            //dont want to animate when resetting the background position
            reel.style.transition = 'none';
            //sets the position back to this starting point
            reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
            sfx.stopSound.play()
            //return index of reel
            //index is reversed becuase we start at the banana and rotate backwards
            res(delta % numIcons)
        }, /* 100 */8 + delta * timePerIcon)
    })
}

const addPoint = () => gameNumsArr[3] += gameNumsArr[2];

const removePoint = () => gameNumsArr[3] -= gameNumsArr[1];

const clearWinnings = () => gameNumsArr[2] = 0;

const checkJPWin = () => {
    if (jackpotWin) {
        jackpotWin = false;
        gameNumsArr[0] = 100;
    }
}

const animateJPNum = () => {
    let endVal = gameNumsArr[0] + gameNumsArr[1];
    let counter = setInterval(() => {
        gameNumsArr[0]++;
        gameNumDivs[0].textContent = gameNumsArr[0];
        if (gameNumsArr[0] === endVal) {
            clearInterval(counter);
        }
    }, 200)
}

const animateWinNum = () => {
    sfx.winLoop.play();
    let endVal = gameNumsArr[3] + gameNumsArr[2];
    let counter = setInterval(() => {
        gameNumsArr[3]++
        gameNumDivs[3].textContent = gameNumsArr[3];
        if (gameNumsArr[3] === endVal) {
            clearInterval(counter);
            sfx.winLoop.stop();
            btnDisable(false)
        }
    }, 100)
}

const displayTotals = (betNum = false) => {
    if (betNum) {
        gameNumDivs[1].innerText = gameNumsArr[1];
        return;
    }
    gameNumDivs.forEach((number, index) => {
        number.innerText = `${gameNumsArr[index]}`
    })
}

const updateWinTable = () => {
    tableNums[0].innerText = `Cur(x${gameNumsArr[1]})`
    for (let i = 1; i < tableNums.length; i++) {
        tableNums[i].innerText = `${baseWinNums[(i - 1)] * gameNumsArr[1]}`
    }
}

const winLOn = () => {
    for (let i = 0; i < wLightIn.length; i++) {
        if (wLightIn[i] === 1) {
            winLights[i].classList.add('animate-light')
        }
    }
}

const winLOff = () => {
    for (let i = 0; i < wLightIn.length; i++) {
        wLightIn[i] = 0;
        winLights[i].classList.remove('animate-light')
    }
}

const twoOfSame = (iconIn, inArray) => {
    if (inArray[0] === iconIn && inArray[1] === iconIn) {
        wLightIn[0] = wLightIn[1] = 1;
        return true;
    }
    if (inArray[1] === iconIn && inArray[2] === iconIn) {
        wLightIn[1] = wLightIn[2] = 1;
        return true
    };
    return false;
}

const threeOfSame = (iconIn, inArray) => {
    if (inArray[0] === iconIn && inArray[1] === iconIn && inArray[2] === iconIn) {
        for (let i = 0; i < wLightIn.length; i++) wLightIn[i] = 1;
        return true;
    }
    return false;
}

const checkWin = (inArr) => {
    //three 7 win = 100
    if (inArr.includes(1)) {
        if (threeOfSame(1, inArr)) {
            jackpotWin = true;
            return gameNumsArr[0]
        };
    }
    //three BARs win = 50
    if (inArr.includes(6)) {
        if (threeOfSame(6, inArr)) return 50;
    }
    //three cherries win = 25
    if (inArr.includes(2)) {
        if (threeOfSame(2, inArr)) return 25;
    }
    //any 3 win = 15
    if (inArr[0] === inArr[1] && inArr[1] === inArr[2]) {
        for (let i = 0; i < wLightIn.length; i++) wLightIn[i] = 1;
        return 15
    };
    //any two 7 || BAR  = 10
    if (inArr.includes(1) || inArr.includes(6)) {
        if (twoOfSame(1, inArr)) return 10;
        if (twoOfSame(6, inArr)) return 10;
    }
    //two cherries win  = 5
    if (inArr.includes(2)) {
        if (twoOfSame(2, inArr)) return 5;
    }
    //single cherry win = 2
    let inFound = inArr.indexOf(2);
    if (inFound === 0 || inFound === 1 || inFound === 2) {
        wLightIn[inFound] = 1;
        return 2
    }
    return 0;
}

const resetBet = () => {
    if (gameNumsArr[1] < gameNumsArr[3]) return;
    gameNumsArr[1] = gameNumsArr[3];
    displayTotals(true);
    lostGame = false;
}

const changeBet = (evt) => {
    if (gameNumsArr[1] === gameNumsArr[3] && evt.currentTarget.betC) return;
    if (gameNumsArr[1] === 10 && evt.currentTarget.betC) return;
    if (gameNumsArr[1] === 1 && !evt.currentTarget.betC) return;
    if (gameNumsArr[3] === 1) return;

    if (gameNumsArr[1] <= gameNumsArr[3] && gameNumsArr[1] < 10 && evt.currentTarget.betC) {
        gameNumsArr[1] += 1;
        sfx.betUp.play();
    }
    if (gameNumsArr[1] > 1 && !evt.currentTarget.betC) {
        gameNumsArr[1] -= 1;
        sfx.betDown.play();
    }

    displayTotals(true);
}

const btnDisable = (tOrF) => {
    for (const btn of btns) {
        btn.disabled = tOrF;
    }
}

const checkLoss = () => {
    if (gameNumsArr[3] === 0) {
        lostGame = true;
    }
}

const showLScreen = () => {
    if (!lostGame) return;
    cardScreens[3].classList.toggle('card-hidden');
}

const gameReset = () => {
    gameNumsArr[0] = 100;
    gameNumsArr[1] = 1;
    gameNumsArr[2] = 0;
    gameNumsArr[3] = 10;
}

const flipAnimation = () => {
    cardScreens[0].classList.toggle('card-flipped');
    setTimeout(() => {
        cardScreens[1].classList.toggle('card-flipped');
    }, 200)
}

const rFlipAnimation = () => {
    cardScreens[1].classList.toggle('card-flipped');
    setTimeout(() => {
        cardScreens[0].classList.toggle('card-flipped');
    }, 200)
}

const toggleInfoScreen = () => {
    cardScreens[2].classList.toggle('card-hidden');
}

const rollAll = () => {
    winLOff();
    btnDisable(true)
    clearWinnings();
    removePoint();
    checkJPWin();
    displayTotals();
    animateJPNum();

    //run all promises and get an array of the returned values all at once
    Promise
        .all([...reelList].map((reel, i) => roll(reel, i)))
        .then((deltas) => {
            sfx.reelSpin.stop();
            deltas.forEach((delta, i) => { indexes[i] = (indexes[i] + delta) % numIcons })
            console.log(indexes);
            if (gotResized) {
                setIconVars();
                setBGPos();
                gotResized = false;
            }
            gameNumsArr[2] = (gameNumsArr[1] * checkWin(indexes));
            winLOn();
            if (gameNumsArr[2]) {
                animateWinNum();
                displayTotals();
                setTimeout(resetBet, (100 * gameNumsArr[2]));
            } else {
                btnDisable(false);
                checkLoss();
                showLScreen();
                resetBet();
            }
        })
}

btn.addEventListener('click', () => {
    rollAll();
    sfx.spin.play();
    sfx.reelSpin.play();
})
cardbtns[0].addEventListener('click', () => {
    cardScreens[0].classList.toggle('card-hidden');
})
cardbtns[1].addEventListener('click', flipAnimation)
cardbtns[2].addEventListener('click', rFlipAnimation)
cardbtns[3].addEventListener('click', toggleInfoScreen)
cardbtns[4].addEventListener('click', () => {
    cardScreens[3].classList.toggle('card-hidden');
    gameReset();
    displayTotals();
})

btns[0].addEventListener('click', () => {
    updateWinTable();
    toggleInfoScreen();
    sfx.infoBtn.play();
})
btns[1].addEventListener('click', changeBet)
btns[1].betC = false;
btns[2].addEventListener('click', changeBet)
btns[2].betC = true;

musicToggle.addEventListener('change', () => {
    if (sfx.gameSong.playing()) return sfx.gameSong.stop();
    sfx.gameSong.play();
})

const testerArr = []
const resizeNums = [[-150, 336, 320], [-190, 336, 320], [-130, 252, 240], [-160, 252, 240], [-140, 210, 200], [-100, 168, 160], [-70, 126, 120], [-30, 126, 120]]
const smallResize = window.matchMedia("screen and (min-width: 480px) and (min-height: 550px)");
const smallResizeTwo = window.matchMedia("screen and (min-width: 600px) and (min-height: 700px)");
const midResize = window.matchMedia("screen and (min-width: 800px) and (min-height: 820px)");
const midResizeTwo = window.matchMedia("screen and (min-width: 900px) and (min-height: 930px)");
const midResizeThree = window.matchMedia("screen and (min-width: 1000px) and (min-height: 1080px)");
const LgResize = window.matchMedia("screen and (min-width: 1200px) and (min-height: 1250px)");
const LgResizeTwo = window.matchMedia("screen and (min-width: 1300px) and (min-height: 1400px)");

const setIconVars = () => {
    for (let i = 0; i < testerArr.length; i++) {
        if (testerArr[i].matches) {
            iconOffset = testerArr[i].iconO
            iconWidth = testerArr[i].iconW
            iconHeight = testerArr[i].iconH
            console.log(`height: ${iconHeight}, width: ${iconWidth}, and offset: ${iconOffset}`);
            return;
        }
    }
    iconOffset = -30;
    iconWidth = 84;
    iconHeight = 80;
    console.log(`height: ${iconHeight}, width: ${iconWidth}, and offset: ${iconOffset}`);
}

const setBGPos = () => {
    for (let i = 0; i < indexes.length; i++) {
        reelList[i].style.backgroundPositionY = `${iconOffset + (iconHeight * indexes[i])}px`
    }
}

const resizeEvt = () => {
    if (btn.disabled) {
        gotResized = true;
        return;
    }
    setIconVars();
    setBGPos();
}

const screenResizeInit = () => {
    testerArr.push(LgResizeTwo, LgResize, midResizeThree, midResizeTwo, midResize, smallResizeTwo, smallResize);
    for (let i = 0; i < testerArr.length; i++) {
        testerArr[i].iconO = resizeNums[i][0];
        testerArr[i].iconW = resizeNums[i][1];
        testerArr[i].iconH = resizeNums[i][2];
        testerArr[i].onchange = resizeEvt;
    }
}

screenResizeInit();
setIconVars();
displayTotals();