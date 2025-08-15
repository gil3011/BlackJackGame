class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
        this.image = `images/${rank}_of_${suit}.png`;
    }
}
class Deck {
    constructor() {
        this.suits = ['diamonds', 'clubs', 'spades', 'hearts'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
        this.values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'jack': 10, 'queen': 10, 'king': 10, 'ace': 1 };
        this.cards = [];

        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                for (let i = 0; i < 8; i++) {
                    this.cards.push(new Card(suit, rank, this.values[rank]));
                }
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        if (this.cards.length < 35) {
            let newDeck = new Deck();
            newDeck.shuffle();
            this.cards = newDeck.cards; 
        }
        return this.cards.pop();
    }

}
class Hand {
    constructor() {
        this.cards = [];
    }
    addCard(card) {
        this.cards.push(card);
    }
    getValue() {
        let value = 0;
        let has_ace = false;
        for (let card of this.cards) {
            value += card.value;
            if (card.rank == 'ace')
                has_ace = true;
        }

        if (has_ace & value <= 11)
            value += 10;
        return value;
    }
    render(elementId, isDealer = false, stand = false) {
        let handDiv = document.getElementById(elementId);
        handDiv.innerHTML = (isDealer) ? '<p id="dealer-value">Dealer hand: ' + this.getValue() + '</p>' : '<p id="player-value">Player hand: ' + this.getValue() + '</p>';

        let totalCards = this.cards.length;
        let cardWidth = 80; 
        let handWidth = (totalCards - 1) * 25 + cardWidth; 

        
        let startPosition = (handDiv.offsetWidth - handWidth) / 2;

        let maxRotation = 4; 

        for (let i = 0; i < totalCards; i++) {
            let card = this.cards[i];
            let cardDiv = document.createElement('div');
            cardDiv.className = 'card';

            cardDiv.style.left = `${startPosition + i * 25}px`;
            
            let rotation = ((i / (totalCards - 1)) * 2 - 1) * maxRotation;
            if (isDealer) {
                rotation = 0; 
            }
            cardDiv.style.transform = `rotate(${rotation}deg)`;

            if (isDealer && i === 1 && !stand) {
                cardDiv.innerHTML = `<img src="images/back3.png" alt="back" />`;
            } else {
                cardDiv.innerHTML = `<img src="${card.image}" alt="${card.rank}${card.suit}" />`;
            }
            handDiv.appendChild(cardDiv);
        }
    }
    hasBlackJack() {
        return (this.getValue() == 21 && this.cards.length == 2);
    }
}

let deck = new Deck();
deck.shuffle();
let playerHand;
let dealerHand;
let playerChips = 100;
let playerBet;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function updateChips() {
    chips.innerText = playerChips;
    bet.innerText = playerBet;
}
function playAgain() {
    betWindow.style.display = 'flex';
    slider.max = Number(playerChips);
    document.querySelector('.placeBet p').innerHTML = 'You have ' + playerChips + ' chips';
    updateChips();
}
async function initializeGame() {
    // remove splited hand from the past game
    let split = document.getElementById('split-hand');
    if (split) {
        document.getElementById('game').removeChild(split);
    }
    // init game
    statusLine.innerHTML = "Let's Play!";
    doubleB.hidden= '';
    hitB.hidden= '';
    standB.hidden= '';
    insuranceYesB.hidden = 'hidden';
    insuranceNoB.hidden = 'hidden';
    splitB.hidden = 'hidden';
    replayB.hidden = 'hidden';

    playerHand = new Hand();
    dealerHand = new Hand();


    playerHand.addCard(deck.deal());
    playerHand.addCard(deck.deal());
    dealerHand.addCard(deck.deal());
    dealerHand.addCard(deck.deal());
    playerChips -= Number(playerBet);

    // show chips bet and card
    updateChips();
    playerHand.render('player-hand');
    dealerHand.render('dealer-hand', true);
    document.getElementById('dealer-value').innerText = "Dealer hand: " + (dealerHand.getValue() - dealerHand.cards[1].value);

    // check for split option
    if (playerHand.cards[0].value == playerHand.cards[1].value) {
        splitB.hidden = '';
    }

    // if player have BJ
    if (playerHand.hasBlackJack()) {
        doubleB.hidden= 'hidden';
        hitB.hidden= 'hidden';
        standB.hidden= 'hidden';
        splitB.hidden= 'hidden';
        await sleep(1000);
        dealerHand.render('dealer-hand', true, true);
        if (dealerHand.hasBlackJack()) {
            await sleep(1000);
            statusLine.innerHTML='Push!';
            playerChips += Number(playerBet);
            resetGame();
        } else {
            await sleep(1000);
            statusLine.innerHTML='Won by BlackJack';
            playerChips += Number(playerBet) * 2.5;
            resetGame();
        }
    } 
    else if (dealerHand.hasBlackJack() && dealerHand.cards[0].rank != 'ace') {
        doubleB.hidden = 'hidden';
        hitB.hidden = 'hidden';
        standB.hidden = 'hidden';
        splitB.hidden = 'hidden';
        await sleep(1000);
        dealerHand.render('dealer-hand', true, true);
        await sleep(1000);
        statusLine.innerHTML = 'Dealer has BlackJack';
        resetGame();
    }
    else if (dealerHand.cards[0].rank == 'ace') {
        statusLine.innerHTML='Dealar have Ace do you want to play Insurance bet?'
        doubleB.hidden = 'hidden';
        hitB.hidden = 'hidden';
        standB.hidden = 'hidden';
        splitB.hidden = 'hidden';
        insuranceYesB.hidden = '';
        insuranceNoB.hidden = '';
    }

}
function changehand(index) {
    if (index == 0) {
        document.getElementById('player-hand').classList.add('grayscale');
        document.getElementById('split-hand').classList.remove('grayscale');
    }
    else {
        document.getElementById('player-hand').classList.remove('grayscale');
    }
}
async function hit() {
    doubleB.hidden = 'hidden';
    splitB.hidden = 'hidden';
    localStorage.removeItem("game");

    if (Array.isArray(playerHand)) {
        
        let currentHand = playerHand[currentHandIndex];
        currentHand.addCard(deck.deal());
        currentHand.render((currentHandIndex == 0 ? 'player-hand' :'split-hand'));
        if (currentHand.getValue() > 21) {
            changehand(currentHandIndex++);            
        }
        else if (currentHand.getValue() == 21) {
            stand();
        }

        if (currentHandIndex >= playerHand.length) {
            if (playerHand[0].getValue() > 21 && playerHand[1].getValue() > 21) {

                dealerHand.render('dealer-hand', true, true);
                changehand(currentHandIndex); 
                resetGame();
            }
            else {
                changehand(currentHandIndex);
                stand();
            }
        }
    }
    else {
        playerHand.addCard(deck.deal());
        if (playerHand.getValue() > 21) {
            playerHand.render('player-hand');
            hitB.hidden = 'hidden';
            standB.hidden = 'hidden';
            await sleep(1000);
            dealerHand.render('dealer-hand', true, true);
            statusLine.innerHTML = 'Player Busts!';
            resetGame();
        }
        else if (playerHand.getValue() == 21) {
            stand();
        }
        playerHand.render('player-hand');
    }
}
async function stand() {
    doubleB.hidden = 'hidden';
    hitB.hidden = 'hidden';
    standB.hidden = 'hidden';
    splitB.hidden = 'hidden';
    localStorage.removeItem("game");
    if (Array.isArray(playerHand) && currentHandIndex < playerHand.length - 1) {
        changehand(currentHandIndex++);
        hitB.hidden = '';
        standB.hidden = '';
        if (playerHand[currentHandIndex].hasBlackJack()) {
            currentHandIndex = 2;
            changehand(currentHandIndex);
            stand();
        }
        else {
            statusLine.innerHTML = 'Right Hand is Playing';
        }
        return
    }
    else if (Array.isArray(playerHand) && currentHandIndex == playerHand.length - 1) {
        changehand(currentHandIndex);
    }
    statusLine.innerHTML = "Dealer's Turn";
    await sleep(1000);
    dealerHand.render('dealer-hand', true, true);

    while (dealerHand.getValue() < 17) {
        await sleep(1000);
        dealerHand.addCard(deck.deal());
        dealerHand.render('dealer-hand', true, true);
    }

    await sleep(1000);

    if (Array.isArray(playerHand)) {
        let str = '';
        statusLine.innerHTML = '';
        for (let hand of playerHand) {
            if (dealerHand.getValue() > 21) {
                statusLine.innerHTML = 'Dealer Busts ';            
            }
            if (hand.getValue() > 21) {
                str += 'Hand ' + (playerHand.indexOf(hand) + 1) + ' Busts!';
            } else if (dealerHand.getValue() > hand.getValue() && dealerHand.getValue() <= 21) {
                str += 'Dealer Wins against Hand ' + (playerHand.indexOf(hand) + 1) + '!';
            } else if (dealerHand.getValue() < hand.getValue() || dealerHand.getValue() > 21) {
                str += 'Hand ' + (playerHand.indexOf(hand) + 1) + ' Wins!';
                playerChips += Number(playerBet) * 2;
            } else {
                str +='Push with Hand ' + (playerHand.indexOf(hand) + 1) + '!';
                playerChips += Number(playerBet);
            }
            str += '<br>';
        }
        statusLine.innerHTML += str;
        
    }
    else {
        if (dealerHand.getValue() > 21) {
            statusLine.innerHTML='Dealer Busts! Player Wins!';
            playerChips += Number(playerBet) * 2;
        } else if (dealerHand.getValue() > playerHand.getValue()) {
            statusLine.innerHTML='Dealer Wins!';
        } else if (dealerHand.getValue() < playerHand.getValue()) {
            statusLine.innerHTML = 'Player Wins!';
            playerChips += Number(playerBet) * 2;
        } else {
            statusLine.innerHTML='Push!';
            playerChips += Number(playerBet);
        }

    }
    updateChips()
    resetGame();
}
async function doubleDown() {
    if (Number(playerChips) < Number(playerBet)) {
        statusLine.innerHTML = "Don't have enough chips";
        return;
    }
    playerChips -= Number(playerBet);
    playerBet *= 2;
    updateChips();
    doubleB.hidden = 'hidden';
    hitB.hidden = 'hidden';
    standB.hidden = 'hidden';
    splitB.hidden = 'hidden';
    await sleep(1000);
    playerHand.addCard(deck.deal());
    playerHand.render('player-hand');
    if (playerHand.getValue() > 21) {
        dealerHand.render('dealer-hand', true, true);
        await sleep(1000);
        statusLine.innerHTML = 'Player Busts!';
        resetGame();
    } else {
        stand();
    }
}
async function playInsurance(call) {
    let insurance = Number(playerBet) * 0.5;
    if (insurance > Number(playerChips)) {
        statusLine.innerHTML = "Don't have enough chips";
        call = false;
    }
    if (!call) {
        if (dealerHand.hasBlackJack()) {
            dealerHand.render('dealer-hand', true, true);
            await sleep(1000);
            statusLine.innerHTML = 'Dealer has BlackJack';
            resetGame();
        }
        else {
            await sleep(1000);
            statusLine.innerHTML = "No BlackJack, Let's Play!";
            doubleB.hidden = '';
            hitB.hidden = '';
            standB.hidden = '';
            if (playerHand.cards[0].value == playerHand.cards[1].value) {
                splitB.hidden = '';
            }
            insuranceYesB.hidden = 'hidden';
            insuranceNoB.hidden = 'hidden';
        }
        return
    }

    if (dealerHand.hasBlackJack()) {
        await sleep(1000);
        dealerHand.render('dealer-hand', true, true);
        await sleep(1000);
        statusLine.innerHTML='Dealer has BlackJack, Insurance won';
        playerChips += Number(insurance) * 2;
        updateChips();
        resetGame();
    }
    else {
        statusLine.innerHTML='Lost Insurance';
        playerChips -= Number(insurance);
        updateChips();
        doubleB.hidden = '';
        hitB.hidden = '';
        standB.hidden = '';
        if (playerHand.cards[0].value == playerHand.cards[1].value) {
            splitB.hidden = '';
        }
        insuranceYesB.hidden = 'hidden';
        insuranceNoB.hidden = 'hidden';
    }
}
function resetGame() {
    if (Number(playerChips) <= 10) {
        document.querySelector('body').innerHTML = '<h1>Game Over! <br> You\'re out of chips.</h1>';
        return;
    }
    doubleB.hidden = 'hidden';
    hitB.hidden = 'hidden';
    standB.hidden = 'hidden';
    insuranceYesB.hidden = 'hidden';
    insuranceNoB.hidden = 'hidden';
    splitB.hidden = 'hidden';
    replayB.hidden = '';

}
function split() {
    if (Number(playerChips) < Number(playerBet)) {
        statusLine.innerHTML = "Don't have enough chips";
        return;
    }
    doubleB.hidden = 'hidden';
    const player_Hand = document.getElementById('player-hand');
    const newHand = document.createElement('div');
    newHand.classList.add('hand');
    newHand.classList.add('grayscale');
    newHand.id = 'split-hand';
    newHand.innerHTML = '<p id="split-value"></p>';
    player_Hand.parentNode.appendChild(newHand);
    playerChips -= Number(playerBet);
    updateChips();

    let hand1 = new Hand();
    let hand2 = new Hand();
    hand1.addCard(playerHand.cards[0]);
    hand2.addCard(playerHand.cards[1]);
    hand1.addCard(deck.deal());
    hand2.addCard(deck.deal());

    hand1.render('player-hand');
    hand2.render('split-hand');
    splitB.hidden = 'hidden';
    playerHand = [hand1, hand2];
    currentHandIndex = 0;
    statusLine.innerHTML = 'Left Hand is Playing';
    // Check for Blackjack
    if (hand1.hasBlackJack() && hand2.hasBlackJack()) {
        currentHandIndex = 2;
        stand();
    }
    else if (hand1.hasBlackJack()) {
        statusLine.innerHTML = 'Right Hand is Playing';
        changehand(currentHandIndex++);
    }
}

let slider = document.getElementById("slider");
let chipsToBet = document.getElementById("betValue");
slider.addEventListener("input", function () {
    chipsToBet.textContent = "Bet: " + this.value;
});
let betWindow = document.querySelector('.overlay');
let doubleB = document.getElementById("double");
let splitB = document.getElementById("split");
let hitB = document.getElementById("hit");
let standB = document.getElementById("stand");
let insuranceYesB = document.getElementById("insurance");
let insuranceNoB = document.getElementById("noinsurance");
let replayB = document.getElementById("replay");
let statusLine = document.getElementById('status');
let chips = document.getElementById('chips');
let bet = document.getElementById('bet');
let playB = document.getElementById('play');

playB.onclick = function (){
    playerBet = slider.value;
    initializeGame();
    betWindow.style.display = 'none';
}

