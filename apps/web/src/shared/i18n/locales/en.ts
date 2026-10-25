import { TranslationSchema } from './ko';

export const en: TranslationSchema = {
  common: {
    loadingPageAria: 'Loading page',
    loadingPageText: 'Loading page...',
  },
  nav: {
    categories: {
      workspace: 'Workspace',
      utility: 'Utilities',
      system: 'System',
      explore: 'Explore',
    },
    fallbackPage: 'Page',
    entries: {
      dashboard: {
        title: 'Dashboard',
        shortLabel: 'Dashboard',
        breadcrumbPage: 'Dashboard',
        commandDescription: 'Dashboard (Workspace Overview)',
      },
      'pdf-tools': {
        title: 'PDF Utilities',
        shortLabel: 'PDF Tools',
        breadcrumbPage: 'PDF Processing Engine',
        commandDescription: 'PDF Processing Engine (Merge, Split, Compress)',
        utilityTitle: 'PDF Processing Engine',
        description:
          'Merge PDF documents, split pages, strip metadata, and optimize locally',
        lastUsed: 'Used 12m ago',
      },
      'dbml-tools': {
        title: 'DBML Utilities',
        shortLabel: 'DBML',
        breadcrumbPage: 'DBML Schema',
        commandDescription: 'DBML Schema Converter (PostgreSQL, MySQL, DDL)',
        utilityTitle: 'DBML Schema Converter',
        description:
          'Interactive ERD visualization and two-way PostgreSQL/MySQL DDL generation',
        lastUsed: 'Used 1h ago',
      },
      docs: {
        title: 'Markdown Docs',
        shortLabel: 'Docs',
        breadcrumbPage: 'Markdown Docs',
        commandDescription: 'Markdown Document Viewer',
        utilityTitle: 'Markdown Document Viewer',
        description:
          'Real-time GFM rendering for local Specifications (Specs) and ADRs',
        lastUsed: 'Used 3h ago',
      },
      'ai-workspace': {
        title: 'AI Workspace',
        shortLabel: 'AI',
        breadcrumbPage: 'AI Workspace',
        commandDescription: 'AI Workspace (Local Knowledge AI Assistant)',
        utilityTitle: 'AI Workspace',
        description:
          'On-device AI agent combining local Markdown knowledge and web research',
        lastUsed: 'Used just now',
      },
    },
  },
  header: {
    ariaLabel: 'Top navigation header',
    langSwitchAria: 'Select language',
    notificationsTitle: 'System notifications',
    notificationsAria: 'System notifications',
    themeTitle: 'Theme (Deep Dark mode active)',
    themeAria: 'Theme settings',
  },
  userProfile: {
    loadingTitle: 'Checking user session...',
    loadingAria: 'Loading user profile',
    unauthenticatedTitle: 'Authentication session not verified',
    unauthenticatedText: 'Unauthenticated',
    loginTitle: 'Go to login / re-authentication portal',
    loginAria: 'Go to login portal',
    loginBtn: 'Sign In',
    badgeLocal: '[Local Dev]',
    badgeAdmin: '[Admin] Administrator',
    badgeGuest: '[Guest Mode] Guest Reviewer',
    chipTitleSuffix: 'Click to view profile and sign out',
    quickLogoutTitle: 'End session and sign out',
    logout: 'Sign Out',
    menuAria: 'User account menu',
    groupsTitle: 'Groups:',
  },
  versionPopover: {
    dialogAria: 'System version and server health',
    closeAria: 'Close popover',
    copyCommitTitle: 'Copy commit hash to clipboard',
    offlineDefault: 'Server connection failed (Offline)',
    checkingStatus: 'Checking status...',
    refreshTitle: 'Refresh all server statuses',
  },
  sidebar: {
    ariaLabel: 'Main sidebar navigation',
    activeVersionTitle: 'Active system version',
    bottomNavAria: 'Mobile bottom navigation',
  },
  dashboard: {
    headerTitle: 'Workspace Overview',
    headerSubtitle:
      'Real-time monitoring for local runtime environment and distributed utilities',
    isolationChipTitle:
      'All operations are processed strictly within the browser and localhost',
    isolationChipLabel: 'Local Isolated Env',
    gridAriaLabel: 'Installed local utilities grid',
    openUtilityAria: 'Open {{title}}',
    openToolLink: 'Open Tool',
    recentTasks: {
      panelAria: 'Recent local task history panel',
      title: 'Recent Local Tasks',
      clearAllTitle: 'Clear all local task history',
      clearBtn: 'Clear History',
      emptyText: 'No recent local tasks have been executed.',
    },
    runtime: {
      panelAria: 'Local runtime environment status panel',
      title: 'Local Runtime Status',
      cacheLabel: 'Local Cache Memory',
      heapLabel: 'Process Heap Memory',
      isolationLabel: 'Process Isolation',
      ipcLabel: 'Local IPC Channel',
      telemetryLabel: 'Remote Telemetry',
      telemetryValue: 'Disabled (100% Isolated)',
    },
  },
  pdfTools: {
    header: {
      title: 'PDF Processing Engine',
      description:
        'Safely merge, split, and unlock PDF documents without external cloud uploads.',
      telemetryTitle: '100% local environment with zero network leakage',
    },
    modes: {
      tabsAria: 'Select PDF operation mode',
      merge: {
        label: 'Merge Documents (Merge)',
        shortLabel: 'Merge',
        description:
          'Combine multiple PDF documents in your preferred order into a single file.',
      },
      'split-range': {
        label: 'Split by Range',
        shortLabel: 'Split Range',
        description:
          'Specify custom page ranges (e.g., 1-3, 5) to extract only selected pages.',
      },
      'split-all': {
        label: 'Split to Pages',
        shortLabel: 'Split All',
        description:
          'Split every page into individual PDF files and download as a ZIP archive.',
      },
      unlock: {
        label: 'Unlock PDF (Unlock)',
        shortLabel: 'Unlock',
        description:
          'Remove password protection from an encrypted PDF and save an unrestricted copy.',
      },
    },
    dropzone: {
      ariaLabel: 'Drop or select PDF files',
      dragPrompt: 'Drag and drop PDF files here, or ',
      browseFiles: 'Browse Files',
      hint: 'Supports PDF files only (Max 50MB per file, 100MB total)',
    },
    fileList: {
      selectedCount: 'Selected Files ({{count}})',
      clearAllTitle: 'Remove all selected files',
      clearAllBtn: 'Clear All',
      inspecting: '• Inspecting...',
      pageCount: '• {{count}} pages',
      encrypted: '• Encrypted',
      removeTitle: 'Remove from file list',
      removeAria: 'Remove {{name}}',
      passwordPlaceholder: 'Enter encrypted PDF password...',
      passwordAria: 'Password for {{name}}',
    },
    config: {
      headerSuffix: '{{label}} Configuration',
      splitRangeLabel: 'Page Ranges to Extract',
      splitRangeHint: 'Separated by commas (,) and hyphens (-)',
      splitRangePlaceholder: 'e.g., 1-3, 5, 8-12',
      unlockPasswordLabel: 'Unlock Password',
      unlockPasswordHint: 'Document open / permission password',
      unlockPasswordPlaceholder: 'Enter password for the protected PDF',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      mergeMinFilesHint: '* Please add at least 2 PDF files to merge documents.',
    },
    summary: {
      title: 'Execution Summary',
      modeLabel: 'Operation Mode',
      expectedOutputLabel: 'Expected Output',
      fileCountLabel: 'Target Files',
      fileCountValue: '{{count}}',
      totalSizeLabel: 'Total File Size',
      securityTitle: '100% Local Security Isolation',
      securityDesc:
        'Uploaded documents are never sent to external cloud servers and are processed strictly within your local workspace.',
      resetBtn: 'Reset',
      processingBtn: 'Processing...',
      executeBtn: 'Run Task',
      validation: {
        noFiles: 'Please add PDF files to process first.',
        mergeMinFiles: 'At least 2 PDF files are required to merge.',
        splitRangeSingleOnly: 'Split by Range supports only 1 file at a time.',
        splitRangeRequired: 'Please enter a page range (e.g., 1-3).',
        singleFileOnly: 'Only a single file (1) can be processed at a time.',
      },
    },
    alerts: {
      corruptedFileNamed:
        "'{{name}}' is corrupted or not a valid PDF document.",
      unsupportedFormat:
        "'{{name}}' is not a supported format. Only PDF files can be uploaded.",
      singleSizeExceeded:
        "'{{name}}' exceeds the maximum single file size limit (50MB).",
      totalSizeExceeded: 'Total upload size cannot exceed 100MB.',
      selectFileFirst: 'Please select a PDF file to process.',
      mergeMinFiles: 'At least 2 PDF files are required to perform a merge.',
      enterSplitRange: 'Please enter a page range to extract. (e.g., 1-3, 5)',
      enterUnlockPassword: 'Please enter the password to unlock the PDF.',
      successDownload:
        "Task completed. '{{filename}}' has been downloaded.",
      taskDetailMerge: 'Merged {{count}} files',
      taskDetailSplitRange: 'Split page range ({{range}})',
      taskDetailSplitAll: 'Split all pages into ZIP archive',
      taskDetailUnlock: 'Unlocked PDF password',
      errors: {
        invalidPassword:
          'Incorrect password. Please double-check your PDF password.',
        passwordRequired:
          'This PDF file is encrypted. Please enter the unlock password.',
        notPasswordProtected: 'This PDF file is not password-protected.',
        minFileCountNotMet:
          'At least 2 PDF files are required to perform a merge.',
        maxFileCountExceeded:
          'Exceeded the maximum number of files (20) allowed for merging.',
        invalidPageRange:
          'Invalid page range. Please enter a valid format (e.g., 1-3, 5) within the total page count.',
        fileSizeExceeded:
          'File size limit exceeded (max 50MB per file, 100MB total).',
        corruptedFile: 'Corrupted file or invalid PDF header (%PDF-).',
        defaultError: 'An error occurred while processing the request.',
        networkError: 'An unknown error occurred while communicating with the server.',
      },
    },
  },
  markdownDocs: {
    library: {
      importing: 'Importing...',
      importMd: 'Import .md',
      newDocument: 'New Document',
      loadingList: 'Loading documents...',
      emptyList: 'No documents found.',
      createFirstDoc: 'Create First Document',
      defaultSnippet:
        'High-performance document pipeline powered by Edge Worker and MinIO. Supports offline local cache and real-time sync.',
      selectedPrefix: 'Selected: ',
      noneSelected: 'None',
      totalDocsCount: '{{count}} documents total',
      importFailed: 'Failed to import markdown file.',
      confirmDeleteDoc: 'Are you sure you want to delete this document?',
      deleteDocFailed: 'Failed to delete document',
      confirmDeleteFolder:
        'Delete this folder? (Documents inside will be kept as uncategorized)',
      deleteFolderFailed: 'Failed to delete folder',
    },
    sidebar: {
      newFolderTitle: 'Create new folder',
      noTags: 'No tags registered',
      allDocuments: 'All Documents',
      addSubfolderTitle: 'Add subfolder',
      editFolderTitle: 'Edit folder',
      deleteFolderTitle: 'Delete folder',
    },
    inspector: {
      emptyPrompt: 'Select a document to view detailed properties and metadata.',
      noAppliedTags: 'No tags applied',
      editDocumentBtn: 'Edit Document',
    },
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The page you requested does not exist or has been moved.',
    backToDashboard: 'Back to Dashboard',
  },
  errorBoundary: {
    title: 'Temporary Rendering Error',
    description:
      'An unexpected error occurred while rendering this view. You can retry loading the page or return to the dashboard.',
    retryBtn: 'Try Again',
    backToDashboardBtn: 'Return to Dashboard',
  },
};
