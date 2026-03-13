export interface ApiRelease {
  download_url: string;
  file_name: string;
  info_json?: {
    factorio_version?: string;
    dependencies?: string[];
  };
  released_at: string;
  version: string;
  sha1?: string;
  feature_flags?: string[];
}

export interface ApiLicense {
  id?: string;
  name?: string;
  title?: string;
  url?: string;
  link?: string;
}

export interface ApiMod {
  name: string;
  title: string;
  owner?: string;
  summary?: string;
  downloads_count?: number;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  score?: number;
  latest_release?: ApiRelease;
  releases?: ApiRelease[];
  description?: string;
  updated_at?: string;
  last_highlighted_at?: string;
  source_url?: string;
  homepage?: string;
  homepage_url?: string;
  license?: string | ApiLicense;
}

export interface ApiBrowseResponse {
  pagination?: {
    count: number;
    page: number;
    page_count: number;
    page_size: number;
    links?: {
      first?: string | null;
      next?: string | null;
      prev?: string | null;
      last?: string | null;
    };
  };
  results: ApiMod[];
}

export interface PortalDetailsExtras {
  sourceUrl?: string;
  homepageUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  images: string[];
}
