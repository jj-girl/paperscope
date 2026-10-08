export interface LiteraturePaper {
  id: string;
  provider: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  abstract: string | null;
  doi: string | null;
  pmid: string | null;
  pmcid: string | null;
  url: string | null;
  fulltext_url: string | null;
  fulltext_readable: boolean;
  citation_count: number | null;
  subjects: string[];
  publication_types?: string[];
  institutions?: string[];
  topics?: string[];
  author_refs?: { id: string; name: string }[];
  institution_refs?: { id: string; name: string }[];
  content_formats?: string[];
}
