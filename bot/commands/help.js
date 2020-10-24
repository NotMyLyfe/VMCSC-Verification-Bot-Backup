module.exports = {
    name: 'help',
    description: 'Pretty self-explanatory, just gets you this list of commands.',
    args: 0,
    adminOnly: false,
    async execute(message, args){
        const data = ['Here\'s a list of all my commands:'];
        const {commands} = message.client;
        for(const commandData of commands){
            var commandInfo = '```\n';
            const command = commandData[1];
            commandInfo += `${command.name}\nDescription: ${command.description}\nAdmin only:${command.adminOnly}\n`;
            if(commandInfo.args >= 0) commandInfo += `Minimum arguments: ${command.args}`;
            else commandInfo += `Required arguments: ${command.args  * -1 - 1}`;
            commandInfo += '```'
            data.push(commandInfo);
        }
        data.push('Need more help? Feel free to message me on Discord, my username is `NotMyLyfe#3937`');
        data.push('Would like to see/contribute to this bot? This repo is available at https://github.com/NotMyLyfe/VMCSC-Verification-Bot');
        return message.author.send(data, {split: true})
            .then(() => {
                if (message.channel.type == 'dm') return;
            })
            .catch(error => {
                console.log(`Could not send help DM to ${message.author.tag}.\n`, error);
            })
    }
}