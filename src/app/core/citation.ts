export type Kind = 'Academic' | 'Industrial';

export interface Citation {
  kind: Kind;
  title: string;
  authors: string;
  year: number;
  url: string;
  urlTitle: string;
}
