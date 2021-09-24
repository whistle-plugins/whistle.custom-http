import cp from 'child_process';
import path from 'path';

const options = { shell: true, stdio: [0, 1, 2] }

cp.spawn('npm run tsc', options);
cp.spawn('npm run copyfile', options);
cp.spawn('npm run watch', options);
cp.spawn('w2 stop && w2 run', {
  ...options,
  cwd: path.resolve(__dirname, '../../')
});
