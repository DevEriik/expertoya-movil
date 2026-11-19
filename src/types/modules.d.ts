declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module 'react-native-web' {
  const rnWeb: any;
  export default rnWeb;
}

declare var process: {
  env: Record<string, string | undefined>;
};
