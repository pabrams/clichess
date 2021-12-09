
export const readStream = (
    processLine: (obj: any) => void 
  ) => (response: any) => {
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf: string|undefined = '';
  return new Promise<void>((resolve, fail) => {
    response.body.on('data', (v: any) => {
      const chunk = decoder.decode(v, { stream: true });
      buf += chunk;
      if (buf){
        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
      }
    });
    response.body.on('end', () => {
      if (buf && buf.length > 0) processLine(JSON.parse(buf));
      resolve();
    });
    response.body.on('error', fail);
  });
};
