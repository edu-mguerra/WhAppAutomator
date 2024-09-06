const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
    loadSavedNumbers(); // Carrega os números salvos ao iniciar o cliente
});

let userStages = new Map();
let blockedUsers = new Set();
const invalidOptionUsers = new Set();

const initialBlockedClients = [
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us", "999999999999@c.us", "999999999999@c.us",
    "999999999999@c.us"
];

initialBlockedClients.forEach(client => blockedUsers.add(client));

let siteNumbers = new Set();
let instagramNumbers = new Set();

const numbersFilePath = './saved_numbers.json';
let lastSavedNumbers = {};

function saveNumbersToFile() {
    const numbersToSave = {
        siteNumbers: Array.from(siteNumbers),
        instagramNumbers: Array.from(instagramNumbers)
    };

    fs.writeFile(numbersFilePath, JSON.stringify(numbersToSave), err => {
        if (err) {
            console.error('Erro ao salvar números em arquivo:', err);
        } else {
            console.log('Números salvos com sucesso!');
            lastSavedNumbers = { ...numbersToSave };
        }
    });
}

function loadSavedNumbers() {
    fs.readFile(numbersFilePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log('Arquivo de números salvos não encontrado. Criando novo arquivo.');
                return;
            }
            console.error('Erro ao ler números salvos:', err);
            return;
        }

        try {
            const savedNumbers = JSON.parse(data);
            savedNumbers.siteNumbers.forEach(number => siteNumbers.add(number));
            savedNumbers.instagramNumbers.forEach(number => instagramNumbers.add(number));
            console.log('Números carregados com sucesso!');
            lastSavedNumbers = { ...savedNumbers };
        } catch (error) {
            console.error('Erro ao parsear números salvos:', error);
        }
    });
}

async function stage0(message) {
    if (!userStages.has(message.from)) {
        userStages.set(message.from, 0);

        const initialMessage = 'Olá! Sou a Mãe Lucinda, responsável pelo atendimento da RA3 Engenharia. É essencial que você responda às perguntas a seguir para facilitar e agilizar o seu atendimento.💙🙂';

        try {
            await client.sendMessage(message.from, initialMessage);
            setTimeout(async () => {
                try {
                    await client.sendMessage(message.from, 'Primeiramente, me ajude a entender o motivo do seu contato.\n\n01 - Quero alugar uma Caçamba\n02 - Possuo uma Caçamba alugada\n03 - Desejo Falar com um Atendente\n\n*Digite apenas o número referente à sua opção.*');
                    userStages.set(message.from, 1);
                } catch (err) {
                    console.error(`Erro ao enviar a mensagem de opções para ${message.from}: ${err}`);
                }
            }, 2000);
        } catch (err) {
            console.error(`Erro ao enviar mensagem inicial para ${message.from}: ${err}`);
        }
    }

    if (message.body.toLowerCase().includes('encontrei o seu site')) {
        if (!siteNumbers.has(message.from)) {
            siteNumbers.add(message.from);
            console.log(`Número ${message.from} foi registrado como vindo do site.`);
        }
    }

    if (message.body.toLowerCase().includes('encontrei seu número online através do instagram')) {
        if (!instagramNumbers.has(message.from)) {
            instagramNumbers.add(message.from);
            console.log(`Número ${message.from} foi registrado como vindo do Instagram.`);
        }
    }
}

async function processOption(message) {
    const option = message.body.trim();
    try {
        switch (option) {
            case '1':
            case '01':
                await client.sendMessage(message.from, 'Você selecionou a opção de alugar uma Caçamba. Confirma esta escolha?\n\nResponda com SIM para confirmar ou NÃO para cancelar.');
                userStages.set(message.from, 11); // Definindo um novo estágio para aguardar a confirmação
                break;
            case '2':
            case '02':
                await client.sendMessage(message.from, 'Você selecionou a opção de possuir uma Caçamba alugada. Confirma esta escolha?\n\nResponda com SIM para confirmar ou NÃO para cancelar.');
                userStages.set(message.from, 21); // Definindo um novo estágio para aguardar a confirmação
                break;
            case '3':
            case '03':
                await client.sendMessage(message.from, 'Você selecionou a opção de falar com um Atendente. Confirma esta escolha?\n\nResponda com SIM para confirmar ou NÃO para cancelar.');
                userStages.set(message.from, 31); // Definindo um novo estágio para aguardar a confirmação
                break;
            default:
                if (!invalidOptionUsers.has(message.from)) {
                    invalidOptionUsers.add(message.from);
                }
                break;
        }
    } catch (error) {
        console.error(`Erro ao processar opção para ${message.from}: ${error}`);
    }
}

async function handleName(message) {
    const name = message.body.trim();
    try {
        await client.sendMessage(message.from, `Seu nome é ${name}.`);
        setTimeout(async () => {
            try {
                await client.sendMessage(message.from, 'Por favor, agora me informe o seu endereço:');
            } catch (err) {
                console.error(`Erro ao solicitar endereço para ${message.from}: ${err}`);
            }
        }, 1000);
        userStages.set(message.from, 3);
    } catch (error) {
        console.error(`Erro ao lidar com o nome para ${message.from}: ${error}`);
    }
}

async function handleAddress(message) {
    const address = message.body.trim();
    try {

        setTimeout(async () => {
            try {
                await client.sendMessage(message.from, 'Me informe o dia da locação:');
            } catch (err) {
                console.error(`Erro ao solicitar data de locação para ${message.from}: ${err}`);
            }
        }, 1000);
        userStages.set(message.from, 4);
    } catch (error) {
        console.error(`Erro ao lidar com o endereço para ${message.from}: ${error}`);
    }
}

async function handleDateTime(message) {
    try {
        const dateTime = message.body.trim();

        await client.sendMessage(message.from, `A data da locação é ${dateTime}.`);
        setTimeout(async () => {
            try {
                await client.sendMessage(message.from, 'Obrigado! Vou encaminhar você para a nossa atendente.💙');
            } catch (err) {
                console.error(`Erro ao encaminhar para atendente para ${message.from}: ${err}`);
            }
        }, 1000);
        userStages.delete(message.from);
        blockedUsers.add(message.from);
    } catch (error) {
        console.error(`Erro ao lidar com data/hora para ${message.from}: ${error}`);
    }
}

async function handleConfirmation(message) {
    const confirmation = message.body.trim().toUpperCase();
    const stage = userStages.get(message.from);

    try {
        switch (stage) {
            case 11: // Confirmação para opção 1
                if (confirmation === 'SIM') {
                    await client.sendMessage(message.from, 'Por favor, me informe o seu nome:');
                    userStages.set(message.from, 2);
                } else if (confirmation === 'NÃO') {
                    await client.sendMessage(message.from, 'Operação cancelada. Por favor, escolha novamente uma das opções válidas.');
                    setTimeout(async () => {
                        await client.sendMessage(message.from, 'Primeiramente, me ajude a entender o motivo do seu contato.\n\n01 - Quero alugar uma Caçamba\n02 - Possuo uma Caçamba alugada\n03 - Desejo Falar com um Atendente\n\n*Digite apenas o número referente à sua opção.*');
                        userStages.set(message.from, 1);
                    }, 1000);
                } else {
                    await client.sendMessage(message.from, 'Por favor, responda com SIM ou NÃO.');
                }
                break;
            case 21: // Confirmação para opção 2
                if (confirmation === 'SIM') {
                    await client.sendMessage(message.from, 'Por favor, me informe o seu nome:');
                    userStages.set(message.from, 2);
                } else if (confirmation === 'NÃO') {
                    await client.sendMessage(message.from, 'Operação cancelada. Por favor, escolha novamente uma das opções válidas.');
                    setTimeout(async () => {
                        await client.sendMessage(message.from, 'Primeiramente, me ajude a entender o motivo do seu contato.\n\n01 - Quero alugar uma Caçamba\n02 - Possuo uma Caçamba alugada\n03 - Desejo Falar com um Atendente\n\n*Digite apenas o número referente à sua opção.*');
                        userStages.set(message.from, 1);
                    }, 1000);
                } else {
                    await client.sendMessage(message.from, 'Por favor, responda com SIM ou NÃO.');
                }
                break;
            case 31: // Confirmação para opção 3
                if (confirmation === 'SIM') {
                    await client.sendMessage(message.from, 'A conversa será finalizada por mim. Vou te encaminhando a um atendente 💙');
                    blockedUsers.add(message.from);
                    setTimeout(async () => {
                        try {

                        } catch (err) {
                            console.error(`Erro ao finalizar a conversa para ${message.from}: ${err}`);
                        }
                    }, 1000);
                    userStages.delete(message.from);
                } else if (confirmation === 'NÃO') {
                    await client.sendMessage(message.from, 'Operação cancelada. Por favor, escolha novamente uma das opções válidas.');
                    setTimeout(async () => {
                        await client.sendMessage(message.from, 'Primeiramente, me ajude a entender o motivo do seu contato.\n\n01 - Quero alugar uma Caçamba\n02 - Possuo uma Caçamba alugada\n03 - Desejo Falar com um Atendente\n\n*Digite apenas o número referente à sua opção.*');
                        userStages.set(message.from, 1);
                    }, 1000);
                } else {
                    await client.sendMessage(message.from, 'Por favor, responda com SIM ou NÃO.');
                }
                break;
            default:
                break;
        }
    } catch (error) {
        console.error(`Erro ao lidar com a confirmação para ${message.from}: ${error}`);
    }
}

const messageHandler = async (message) => {
    if (!message.from.endsWith("@g.us") && message.from !== message.to && !blockedUsers.has(message.from)) {
        // Verifica se a mensagem é uma localização

        if (message.location) {
            await client.sendMessage(message.from, 'Obrigado por fornecer essa localização.');

        }

        if (message.hasMedia) {
            const media = await message.downloadMedia();
            if (media && message.location) {
                await client.sendMessage(message.from, 'Obrigado por fornecer essa informação.');

                return; // Retorna para não processar outras verificações se for uma localização
            }
        }

        if (!userStages.has(message.from)) {
            await stage0(message);
        } else {
            const stage = userStages.get(message.from);
            switch (stage) {
                case 0:
                    await stage0(message);
                    break;
                case 1:
                    await processOption(message);
                    break;
                case 2:
                    await handleName(message);
                    break;
                case 3:
                    await handleAddress(message);
                    break;
                case 4:
                    await handleDateTime(message);
                    break;
                case 11:
                case 21:
                case 31:
                    await handleConfirmation(message);
                    break;
                default:
                    break;
            }
        }
    }
};

client.on('message_create', messageHandler);

if (!client.isInitialized) {
    client.initialize();
}

module.exports = client;
