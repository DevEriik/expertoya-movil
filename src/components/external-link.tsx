import { Href, Link } from '@/navigation/routerCompat';
import { type ComponentProps } from 'react';
import { Linking, Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event: any) => {
        if (Platform.OS !== 'web') {
          event?.preventDefault?.();
          await Linking.openURL(href);
        } else if (typeof window !== 'undefined') {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }}
    />
  );
}
