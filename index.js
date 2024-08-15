const mineflayer = require('mineflayer')
const telegram = require('node-telegram-bot-api')

const cfg = require('.//config.json')

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

let queue = 0
let active = false

let info = {
    data_sell: 0,
    data_update: 0,

    buy: 0,
    sell: 0,

    balance_session: 0,
    balance: 0
}

const bot = mineflayer.createBot({
    host: 'SpookyTime.net',
    username: cfg.nick,
    version: '1.18.2',
    hideErrors: true
})

const telegram_bot = new telegram(cfg.token, {polling: true});

telegram_bot.on('text', msg => {
    if (msg.text === '/stats') {
        bot.chat('/money')
        telegram_bot.sendMessage(msg.from.id, `Ваша статистика:\n\nВсего куплено кирок за сеанс: ${info.buy}\nВсего продано кирок за сеанс: ${info.sell}\n\nС момента последней продажи: ${info.data_sell}\nC момента последнего обновления: ${info.data_update}\n\nЗаработано за сессию: ${info.balance_session}\nБаланс: ${info.balance}`)
    }
})

async function craft() {
    const position = bot.entity.position.offset(0, -1, 0)
    const bell = bot.blockAt(position)

    bot.chat('/shop')
    bot.once('windowOpen', async window => {

        while (window.slots[21] === null) await sleep(1)
        while (window.slots[21].name !== "gold_ingot") await sleep(1)

        bot.clickWindow(21, 0, 0)
        bot.once('windowOpen', async window => {

            while (window.slots[23] === null) await sleep(1)
            while (window.slots[23].name !== "emerald") await sleep(1)

            bot.clickWindow(23, 0, 0)
            bot.clickWindow(23, 0, 0)
            bot.clickWindow(23, 0, 0)
            bot.closeWindow(window)

            bot.activateBlock(bell)
            
            bot.once('windowOpen', async window => {
                const items = window.items()
        
                for (let i = 0; i < items.length; i++) {
        
                    if (items[i].displayName === 'Emerald') {
                        await sleep(300)
                        bot.clickWindow(items[i].slot, 0, 0)
                        for (let i = 1; i < 4; i++) {await sleep(300), bot.clickWindow(i, 1, 0)}
                        await sleep(500)
                        bot.clickWindow(items[i].slot, 0, 0)
                    } else if (items[i].displayName === 'Stick' && window.slots[5] === null) {
                        await sleep(500)
                        bot.clickWindow(items[i].slot, 0, 0)
                        for (let i = 5; i < 9; i += 3) {await sleep(300), bot.clickWindow(i, 1, 0)}
                        await sleep(500)
                        bot.clickWindow(items[i].slot, 0, 0)
                }}

                bot.clickWindow(0, 0, 0)
                await sleep(300)
                bot.clickWindow(45, 0, 0)
                setTimeout(() => {
                    bot.closeWindow(window)
                    setTimeout(() => {
                        bot.setQuickBarSlot(8)
                        setTimeout(() => {bot.chat('/ah sell 199999')}, 200)
                    }, 200);
                }, 300)
            })
        })
    })
}

bot.on('messagestr', msg => {
    // console.log(msg)
    if (msg.indexOf('[✾] Успешная авторизация! Приятной игры!') !== -1) {
        bot.chat(`/an${cfg.an}`)
        bot.once('spawn', () => {
            setTimeout(() => {
                bot.chat("/ah")
                bot.once("windowOpen", (window) => {
                    bot.clickWindow(46, 0, 0)
                    bot.once("windowOpen", (window) => {
                        for (let i = 0; i <= cfg.slots_count; i++)
                            if (window.slots[i] === null)
                                queue++
                        console.log(`Боту нужно добавить: ${queue} кир(орк/ки)`)

                        bot.closeWindow(window)
                    })
                })
                
                // Проверка очереди и обновление товаров
                setInterval(() => {
                    if (!active && queue > 0) {
                        active = true
                        craft()
                    }
                }, 100)
                setInterval(() => {
                    if (!active) {
                        active = true
                        bot.chat('/ah')
                        bot.once('windowOpen', async () => {
                            await sleep(1000)
                            bot.clickWindow(46, 0, 0)
                            bot.once('windowOpen', async window => {
                                await sleep(1000)
                                bot.clickWindow(52, 0, 0)
                                await sleep(1000)
                                bot.closeWindow(window)
                            })
                        })
                        active = false
                    }
                }, 60000)
            }, 35000)
        })
    } else if (msg.indexOf('123123') !== -1) bot.chat('/tpaccept')
    else if (msg.indexOf('1233') !== -1) bot.chat('/clan home')
    else if (msg.indexOf('У Вас купили') !== -1) {
        console.log('Вы продали кирку и заработали: 199999$')
        info.sell += 1
        info.balance_session += 10000
        info.data_sell = new Date().getHours() + ':' + new Date().getMinutes()
        queue++
    } else if (msg.indexOf('Предметы успешно перевыставлены') !== -1) {
        console.log('Ваши товары перевыставлены')
        info.data_update = new Date().getHours() + ':' + new Date().getMinutes()
    } else if (msg.indexOf('выставлен на продажу') !== -1) {
        info.buy += 1
        queue--
        active = false
    } else if (msg.indexOf('воздух') !== -1) active = false
    else if (msg.indexOf('Ваш баланс') !== -1) info.balance = msg.split(': ')[1]
})

bot.on('kicked', console.log)