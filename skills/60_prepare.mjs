import { alan, bot, utilitas } from 'utilitas';

const checkUnsupportedMimeType = async ctx => {
    ctx.carry.attachments = [];
    for (const x of ctx.collected.filter(x => x.type === 'PROMPT')) {
        let notSupported = false;
        ctx.selectedAi.map(y => {
            if (![
                ...alan.MODELS[ctx._.ai[y].model]?.supportedMimeTypes || [],
                ...alan.MODELS[ctx._.ai[y].model]?.supportedAudioTypes || [],
            ].includes(y?.content?.mime_type)) { notSupported = true; }
        });
        notSupported ? await x.content.analyze() : ctx.carry.attachments.push({
            ...x.content, analyze: undefined,
        });
    }
};

const action = async (ctx, next) => {
    // avatar
    if (ctx.result) {
        ctx.avatar = '⚙️';
    } else if (ctx.m?.voice) {
        ctx.avatar = bot.EMOJI_SPEECH; ctx.result = utilitas.trim(ctx.txt);
    } else if (ctx.m?.data) {
        ctx.avatar = '🔘'; ctx.result = utilitas.trim(ctx.txt);
    } else if (ctx.m?.poll) {
        ctx.avatar = '📊';
    } else if (ctx.cmd?.cmd && !ctx.cmd?.ignored) {
        ctx.avatar = '🚀'; ctx.result = utilitas.trim(ctx.txt);
    } else {
        ctx.avatar = '😸';
    }
    // prompt
    await checkUnsupportedMimeType(ctx);
    const maxInputTokens = alan.getMaxChatPromptLimit()
        - alan.ATTACHMENT_TOKEN_COST * ctx.carry.attachments.length;
    const additionInfo = ctx.collected.filter(
        x => String.isString(x.content)
    ).map(x => x.content).join('\n').split(' ').filter(x => x);
    ctx.prompt = (ctx.txt || '') + '\n\n';
    while (await alan.countTokens(
        `${ctx.prompt}${additionInfo?.[0] || ''}`
    ) < maxInputTokens && additionInfo.length) {
        ctx.prompt += `${additionInfo.shift()} `;
    }
    ctx.prompt = utilitas.trim(ctx.prompt);
    additionInfo.filter(x => x).length && (ctx.prompt += '...');
    // next
    await next();
};

export const { name, run, priority, func } = {
    name: 'Prepare',
    run: true,
    priority: 60,
    func: action,
};
