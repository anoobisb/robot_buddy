// Every spoken or visible string lives here, keyed. Components never inline text.
// `{name}` placeholders are filled by t(key, vars).
export const en = {
  'app.title': 'Robot Buddy',

  'start.tap': 'Tap to start',
  'start.hello': "Hi! I'm Bolt. Let's play!",

  'ui.home': 'Home',
  'ui.replay': 'Say it again',
  'ui.mute': 'Sound off',
  'ui.unmute': 'Sound on',
  'ui.grownups': 'Grown-ups',

  'hub.intro': "Hi, I'm Bolt! Pick a game to play with me.",
  'hub.teach': 'Teach Bolt',
  'hub.program': 'Program Bolt',
  'hub.safety': "Bolt's Safe Net",
  'hub.stickers': '{n} stickers',

  'sticker.got': 'You got a sticker! Well done!',
  'sticker.again': 'Play again',
  'sticker.next': 'Next game',
  'sticker.home': 'Home',

  // Level 1: Teach Bolt
  'l1.fruit.intro':
    "Bolt is a new robot. It doesn't know what a fruit is. Can you teach it? Put each picture in the fruit box or the not-fruit box.",
  'l1.fruit.yes': 'a fruit',
  'l1.fruit.no': 'not a fruit',
  'l1.animal.intro':
    "Bolt doesn't know what an animal is. Can you teach it? Put each picture in the animal box or the toy box.",
  'l1.animal.yes': 'an animal',
  'l1.animal.no': 'a toy',
  'l1.fly.intro':
    'Bolt wants to know what can fly. Can you teach it? Put each picture in the sky box or the ground box.',
  'l1.fly.yes': 'something that flies',
  'l1.fly.no': "something that can't fly",
  'l1.teachMore': 'Show me some more!',
  'l1.learning': "Ohh, I'm learning!",
  'l1.guessTime': 'Guess time! Is Bolt right? Tap the tick for yes, or the cross for no.',
  'l1.guess': "I think it's {label}!",
  'l1.yay': 'Yay! I got it right!',
  'l1.oops': 'Oops! I got it wrong.',
  'l1.fewExamples': "Hmm, I'm not sure. I only learned from a few examples!",
  'l1.showMe': 'Can you show me where it goes?',
  'l1.thanks': 'Thank you! Now I know more!',
  'l1.tryAgain': "Oops, let's try again!",
  'l1.lookAgain': "Hmm, let's look again. Is Bolt right?",
  'l1.recap': 'The more examples you showed me, the smarter I got!',
  'l1.right': 'Yes, right',
  'l1.wrong': 'No, not right',
  'l1.brain': "Bolt's brain: {n} examples",
  'l1.bin': 'Box: {label}',

  // Level 2: Program Bolt
  'l2.intro':
    'Bolt needs to get to the battery! Tell Bolt what to do, step by step. Tap the arrows, then press play.',
  'l2.fixIntro':
    'Uh oh, this program has a bug! Press play to find it. Tap the wrong step, then pick a new arrow.',
  'l2.next': 'Here is a new one! Help Bolt get to the battery.',
  'l2.go': 'Go!',
  'l2.done': 'I did it!',
  'l2.bug': "Oops! Let's find the bug!",
  'l2.more': 'Oops! I need more steps.',
  'l2.empty': 'Tap an arrow to add a step!',
  'l2.full': 'No more room! Press play.',
  'l2.up': 'Up',
  'l2.down': 'Down',
  'l2.left': 'Left',
  'l2.right': 'Right',
  'l2.repeat': 'Repeat two times',
  'l2.repeatIntro':
    'This arrow box does its steps two times! Put arrows in the repeat box, then press play.',
  'l2.run': 'Play',
  'l2.clear': 'Clear all',
  'l2.slot': 'Step {n}',
  'l2.slotEmpty': 'Step {n}, empty',
  'l2.continue': 'Next puzzle',

  // Level 3: Bolt's Safe Net
  'l3.intro': "Bolt is playing on the computer. Let's help Bolt stay safe!",
  'l3.s1.q':
    'A box pops up. It says: You won a prize! Tell us where you live! What should Bolt do?',
  'l3.s1.bad': 'Type our address',
  'l3.s1.good': 'Ask a grown-up',
  'l3.s2.q': 'Someone in a game asks: What is your name and your school? What should Bolt do?',
  'l3.s2.bad': 'Tell them',
  'l3.s2.good': 'Ask a grown-up',
  'l3.s3.q': 'Someone asks Bolt for a photo of its face. What should Bolt do?',
  'l3.s3.bad': 'Send a photo',
  'l3.s3.good': 'Say no and ask a grown-up',
  'l3.s4.q': 'The screen looks strange and confusing. What should Bolt do?',
  'l3.s4.bad': 'Keep looking',
  'l3.s4.good': 'Close it and tell a grown-up',
  'l3.s5.q': 'A friend asks for Bolt’s secret password. What should Bolt do?',
  'l3.s5.bad': 'Tell my friend',
  'l3.s5.good': 'Keep it secret',
  'l3.again': "Hmm, let's think again.",
  'l3.yay': 'Great choice!',
  'l3.rule': "If you're not sure, ask a grown-up!",
  'l3.rule5': 'Passwords are secret. Only share them with your grown-up!',
  'l3.recap': 'You kept Bolt safe online. Thank you!',

  // Grown-up gate
  'gate.hold': 'Grown-ups: press and hold for 3 seconds',
  'gate.question': 'What is {a} + {b}?',
  'gate.ok': 'OK',
  'gate.del': 'Delete',
  'gate.close': 'Close',
  'gate.wrong': 'Not quite. Try this one.',

  // Grown-up corner
  'corner.title': 'Grown-up corner',
  'corner.sound': 'Sound and voice',
  'corner.mute': 'Mute all sound',
  'corner.test': 'Test sound',
  'corner.testLine': 'Hello! Can you hear me?',
  'corner.noSound':
    'No sound? Check the volume, and on iPhone or iPad check the silent switch. Voice needs one tap on the start screen first.',
  'corner.voice': 'Voice',
  'corner.voiceAuto': 'Best available',
  'corner.noVoices': 'No voices found on this device. Captions and sound effects will be used.',
  'corner.rate': 'Speaking speed',
  'corner.progress': 'Progress',
  'corner.progressLine': 'Stickers: Teach {a}, Program {b}, Safe Net {c}.',
  'corner.reset': 'Reset progress',
  'corner.resetConfirm': 'Tap again to reset',
  'corner.resetDone': 'Progress cleared.',
  'corner.talk': 'Talk about it',
  'corner.learning': 'What your child is learning',
  'corner.install': 'Install on a tablet or phone',
  'corner.installText':
    'iPhone or iPad (Safari): tap Share, then Add to Home Screen. Android (Chrome): tap the menu, then Install app or Add to Home screen. After the first visit it works without Wi-Fi.',
  'corner.privacy': 'Privacy',
  'corner.privacyText':
    'No accounts, no ads, no tracking. Nothing leaves this device. Progress is saved only in this browser.',
  'corner.credits': 'Credits and licences',
  'corner.creditsText':
    'Robot Buddy is free and open source. Bolt, the sounds and all pictures are made in code for this game. Emoji are drawn by your device’s own font. Source code: github.com (see README).',
  'corner.done': 'Back to the game',

  'corner.teach.title': 'Teach Bolt',
  'corner.teach.learn':
    'AI learns from examples. When Bolt has only seen a few, it makes mistakes, and when your child corrects it, Bolt improves. This is how real AI is trained.',
  'corner.teach.q1': 'Why did Bolt get it wrong the first time?',
  'corner.teach.q2': 'What could we show Bolt to help it learn?',
  'corner.teach.q3': 'Is a tomato a fruit? How do you know?',
  'corner.teach.q4': 'Can you think of something that might trick Bolt?',

  'corner.program.title': 'Program Bolt',
  'corner.program.learn':
    'Computers follow steps exactly, in order. A mistake in the steps is called a bug, and finding and fixing bugs is a normal part of making programs.',
  'corner.program.q1': 'What happened when a step was in the wrong order?',
  'corner.program.q2': 'How did you find the bug?',
  'corner.program.q3': 'Can you give me steps to get to the kitchen?',

  'corner.safety.title': "Bolt's Safe Net",
  'corner.safety.learn':
    'Personal things like your name, school, address, photos and passwords stay private. When something online feels strange, the answer is always to ask a grown-up.',
  'corner.safety.q1': 'Who do we ask when something online feels weird?',
  'corner.safety.q2': 'What things are private and just for our family?',
  'corner.safety.q3': 'What would you do if a game asked for your name?',
  'corner.safety.q4': 'Why is a password a secret?',
} as const;

export type StringKey = keyof typeof en;
