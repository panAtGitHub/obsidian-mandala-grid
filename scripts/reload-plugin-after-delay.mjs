import { execFile } from 'node:child_process';

const delayMs = Number(process.env.MANDALA_RELOAD_DELAY_MS ?? '1200');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await wait(delayMs);

await new Promise((resolve, reject) => {
    execFile(
        'obsidian',
        ['plugin:reload', 'id=mandala-grid'],
        (error, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
            if (error) {
                reject(error);
                return;
            }
            resolve();
        },
    );
});
