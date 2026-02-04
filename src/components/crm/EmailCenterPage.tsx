import React, { useState, useEffect, useRef } from 'react';
import { Send, Mail, Clock, CheckCircle, AlertCircle, Search, RefreshCw, User, Building2, X, FileText, Users, BarChart3, Plus, Trash2, Edit, Bold, Italic, Underline, List, ListOrdered, Link, Image, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { emailApi, templateApi, mediaApi, SentEmail, EmailContact, EmailTemplate } from '../../services/api';

type Tab = 'compose' | 'bulkSend' | 'templates' | 'campaigns' | 'history';

interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  isImage: boolean;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  sentAt?: string;
}

// Rich Text Editor Toolbar Component
interface RichTextToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onContentChange: (html: string) => void;
  showImageResize?: boolean;
}

function RichTextToolbar({ editorRef, onContentChange, showImageResize = true }: RichTextToolbarProps) {
  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setTimeout(() => {
      if (editorRef.current) {
        onContentChange(editorRef.current.innerHTML);
      }
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const resizeImages = (widthPercent: number, sideBySide = false) => {
    if (!editorRef.current) return;
    const images = editorRef.current.querySelectorAll('img');
    images.forEach(img => {
      img.style.width = sideBySide ? '48%' : `${widthPercent}%`;
      img.style.height = 'auto';
      img.style.display = 'inline-block';
      img.style.verticalAlign = 'top';
      img.style.marginRight = sideBySide ? '2%' : '0';
    });
    onContentChange(editorRef.current.innerHTML);
  };

  const btnStyle: React.CSSProperties = {
    padding: '6px 8px',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const btnHoverStyle = { backgroundColor: '#1a2332', color: 'white' };

  return (
    <div style={{ display: 'flex', gap: '2px', padding: '8px', backgroundColor: '#0b1220', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #1a2332', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Text Formatting */}
      <button type="button" onClick={() => execCommand('bold')} style={btnStyle} title="Bold (Ctrl+B)"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <Bold size={16} />
      </button>
      <button type="button" onClick={() => execCommand('italic')} style={btnStyle} title="Italic (Ctrl+I)"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <Italic size={16} />
      </button>
      <button type="button" onClick={() => execCommand('underline')} style={btnStyle} title="Underline (Ctrl+U)"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <Underline size={16} />
      </button>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#2a3442', margin: '0 6px' }} />

      {/* Font Size */}
      <select
        onChange={(e) => execCommand('fontSize', e.target.value)}
        style={{ padding: '4px 8px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
        defaultValue="3"
        title="Font Size"
      >
        <option value="1">Small</option>
        <option value="3">Normal</option>
        <option value="5">Large</option>
        <option value="7">Huge</option>
      </select>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#2a3442', margin: '0 6px' }} />

      {/* Lists */}
      <button type="button" onClick={() => execCommand('insertUnorderedList')} style={btnStyle} title="Bullet List"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <List size={16} />
      </button>
      <button type="button" onClick={() => execCommand('insertOrderedList')} style={btnStyle} title="Numbered List"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <ListOrdered size={16} />
      </button>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#2a3442', margin: '0 6px' }} />

      {/* Alignment */}
      <button type="button" onClick={() => execCommand('justifyLeft')} style={btnStyle} title="Align Left"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <AlignLeft size={16} />
      </button>
      <button type="button" onClick={() => execCommand('justifyCenter')} style={btnStyle} title="Align Center"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <AlignCenter size={16} />
      </button>
      <button type="button" onClick={() => execCommand('justifyRight')} style={btnStyle} title="Align Right"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <AlignRight size={16} />
      </button>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#2a3442', margin: '0 6px' }} />

      {/* Link & Image */}
      <button type="button" onClick={insertLink} style={btnStyle} title="Insert Link"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <Link size={16} />
      </button>
      <button type="button" onClick={insertImage} style={btnStyle} title="Insert Image URL"
        onMouseEnter={e => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: '#9ca3af' })}>
        <Image size={16} />
      </button>

      {/* Text Color */}
      <input
        type="color"
        onChange={(e) => execCommand('foreColor', e.target.value)}
        style={{ width: '28px', height: '28px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
        title="Text Color"
        defaultValue="#ffffff"
      />

      {/* Image Resize Options */}
      {showImageResize && (
        <>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#2a3442', margin: '0 6px' }} />
          <span style={{ color: '#6b7280', fontSize: '11px', marginRight: '4px' }}>Img:</span>
          {[25, 50, 75, 100].map(size => (
            <button
              key={size}
              type="button"
              onClick={() => resizeImages(size)}
              style={{ padding: '3px 6px', backgroundColor: '#1a2332', color: '#9ca3af', border: '1px solid #2a3442', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
              title={`Resize images to ${size}%`}
            >
              {size}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => resizeImages(48, true)}
            style={{ padding: '3px 6px', backgroundColor: '#1a2332', color: '#00ff88', border: '1px solid #00ff88', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
            title="Side by Side"
          >
            Side
          </button>
        </>
      )}
    </div>
  );
}

export function EmailCenterPage() {
  const [activeTab, setActiveTab] = useState<Tab>('compose');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Compose form state
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<EmailContact | null>(null);
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState<AttachmentItem[]>([]);
  const composeEditorRef = useRef<HTMLDivElement | null>(null);
  const skipComposeSyncRef = useRef(false);
  const [pendingUploads, setPendingUploads] = useState(0);

  // Bulk send state
  const [allContacts, setAllContacts] = useState<EmailContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [bulkHtmlBody, setBulkHtmlBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [bulkAttachments, setBulkAttachments] = useState<AttachmentItem[]>([]);
  const bulkEditorRef = useRef<HTMLDivElement | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateHtmlBody, setTemplateHtmlBody] = useState('');
  const [templateAttachments, setTemplateAttachments] = useState<AttachmentItem[]>([]);
  const templateEditorRef = useRef<HTMLDivElement | null>(null);
  const signatureEditorRef = useRef<HTMLDivElement | null>(null);
  const [includeTemplateSignature, setIncludeTemplateSignature] = useState(false);
  const [selectedTemplateSignatureId, setSelectedTemplateSignatureId] = useState<string>('');

  // Signatures
  const [signatures, setSignatures] = useState<{ id: string; name: string; html: string }[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureHtml, setSignatureHtml] = useState('');
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');
  const [includeSignature, setIncludeSignature] = useState(false);
  const signatureSelectionRef = useRef<Range | null>(null);
  const skipSignatureSyncRef = useRef(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // History state
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'compose' && (showContactPicker || contactSearch)) {
      loadContacts();
    } else if (activeTab === 'bulkSend') {
      loadAllContacts();
      loadTemplates();
    } else if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, contactSearch, showContactPicker, stateFilter]);

  useEffect(() => {
    const stored = localStorage.getItem('crm_email_signatures');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; name: string; html: string }[];
        const cleaned = parsed.map((sig) => {
          let html = sig.html || '';
          html = html.replace(/<img[^>]*alt=["']Signature image["'][^>]*>/gi, '');
          html = html.replace(/<img[^>]*src=["']\s*["'][^>]*>/gi, '');
          html = html.replace(/<img[^>]*src=["']https?:\/\/(localhost|127\.0\.0\.1)[^"']*["'][^>]*>/gi, '');
          html = html.replace(/Signature image/gi, '');
          return { ...sig, html };
        });
        setSignatures(cleaned);
      } catch {
        setSignatures([]);
      }
      return;
    }

    const defaultSignatureHtml = `Cheers,<br/><strong>Dani</strong><br/><div style="height:3px;background:#3b82f6;margin:10px 0;"></div><strong>Danielle Mako</strong><br/>Fourtify Defence Pty Ltd, Chief Executive Officer<br/>Secure. Sovereign. Defence-Ready.<br/>Fourtify Defence Pty Ltd<br/>+61 4 1935 2820<br/>dani@fourd.com.au<br/>17-21 University Avenue<br/>Canberra, ACT 2601<br/><a href="https://www.fourd.com.au" target="_blank" rel="noreferrer">https://www.fourd.com.au</a><br/><br/><span style="font-size:12px;color:#6b7280;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</span>`;

    setSignatures([{ id: 'sig:default-dani', name: 'Dani Default', html: defaultSignatureHtml }]);
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_email_signatures', JSON.stringify(signatures));
  }, [signatures]);

  useEffect(() => {
    if (includeSignature && !selectedSignatureId && signatures.length > 0) {
      setSelectedSignatureId(signatures[0].id);
    }
  }, [includeSignature, selectedSignatureId, signatures]);

  useEffect(() => {
    if (includeTemplateSignature && !selectedTemplateSignatureId && signatures.length > 0) {
      setSelectedTemplateSignatureId(signatures[0].id);
    }
  }, [includeTemplateSignature, selectedTemplateSignatureId, signatures]);

  useEffect(() => {
    if (!signatureEditorRef.current) return;
    if (skipSignatureSyncRef.current) {
      skipSignatureSyncRef.current = false;
      return;
    }
    const nextHtml = signatureHtml || '';
    if (signatureEditorRef.current.innerHTML !== nextHtml) {
      signatureEditorRef.current.innerHTML = nextHtml;
    }
  }, [signatureHtml]);

  useEffect(() => {
    if (!composeEditorRef.current) return;
    if (skipComposeSyncRef.current) {
      skipComposeSyncRef.current = false;
      return;
    }
    const nextHtml = bodyHtml || '';
    if (composeEditorRef.current.innerHTML !== nextHtml) {
      composeEditorRef.current.innerHTML = nextHtml;
    }
  }, [bodyHtml]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const loadContacts = async () => {
    try {
      const data = await emailApi.getContacts(contactSearch, 20);
      setContacts(data.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadAllContacts = async () => {
    setLoading(true);
    try {
      const data = await emailApi.getContacts('', 500, stateFilter || undefined);
      setAllContacts(data.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateApi.getAll();
      setTemplates(data.templates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await emailApi.getCampaigns();
      setCampaigns(data.campaigns);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await emailApi.getHistory(50);
      setSentEmails(data.emails);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectContact = (contact: EmailContact) => {
    setSelectedContact(contact);
    setToEmail(contact.email);
    setToName(`${contact.firstName} ${contact.lastName}`);
    setShowContactPicker(false);
    setContactSearch('');
  };

  const clearRecipient = () => {
    setSelectedContact(null);
    setToEmail('');
    setToName('');
  };

  const buildHtmlBody = (baseHtml: string, attachments: AttachmentItem[]) => {
    if (attachments.length === 0) return baseHtml;
    const attachmentMarkup = attachments
      .map((file) =>
        file.isImage
          ? `<div style=\"margin:8px 0;\"><img src=\"${file.dataUrl}\" alt=\"${file.name}\" style=\"max-width:100%;height:auto;\" /></div>`
          : `<div style=\"margin:6px 0;\"><a href=\"${file.dataUrl}\" download=\"${file.name}\">${file.name}</a></div>`
      )
      .join('');
    const separator = baseHtml ? '<hr style="margin:16px 0;border:0;border-top:1px solid #e5e7eb;" />' : '';
    return `${baseHtml}${separator}<div>${attachmentMarkup}</div>`;
  };

  const stripHtml = (html: string) =>
    html.replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\u200E/g, '')
      .trim();

  const textToHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

  const stripLrmFromHtml = (html: string) =>
    html
      .replace(/\u200E/g, '')
      .replace(/<span[^>]*data-lrm=["']true["'][^>]*>\s*<\/span>/gi, '');

  const beginUpload = () => setPendingUploads((count) => count + 1);
  const endUpload = () => setPendingUploads((count) => Math.max(0, count - 1));

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const [meta, content] = dataUrl.split(',');
    const match = /data:(.*?);/i.exec(meta);
    const mime = match?.[1] || 'image/png';
    const binary = atob(content || '');
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  };

  const fetchUrlToFile = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const ensureHostedImagesInHtml = async (html: string) => {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = Array.from(doc.images);
    for (const img of images) {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('data:image')) {
        const file = dataUrlToFile(src, `upload-${Date.now()}.png`);
        const result = await mediaApi.uploadImage(file);
        img.setAttribute('src', result.url);
        img.removeAttribute('data-upload-id');
      } else if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(src)) {
        const file = await fetchUrlToFile(src, `upload-${Date.now()}.png`);
        const result = await mediaApi.uploadImage(file);
        img.setAttribute('src', result.url);
      }
    }
    return doc.body.innerHTML;
  };

  const normalizeSignatureHtml = (html: string) => {
    const withoutBadImages = html
      .replace(/<img[^>]*src\s*=\s*(["'])\s*(|)\1[^>]*>/gi, '')
      .replace(/<img[^>]*src=["']https?:\/\/(localhost|127\.0\.0\.1)[^"']*["'][^>]*>/gi, '')
      .replace(/Signature image/gi, '');
    return withoutBadImages.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      if (/style\s*=/.test(attrs)) {
        return `<img${attrs.replace(/style\s*=\s*(["'])(.*?)\1/i, (m, q, s) => {
          const next = `${s};display:block;max-width:140px;height:auto;`;
          return `style=${q}${next}${q}`;
        })}>`;
      }
      return `<img${attrs} style="display:block;max-width:140px;height:auto;" />`;
    });
  };

  const hasUnhostedImages = (html: string) =>
    /data:image|https?:\/\/(localhost|127\.0\.0\.1)/i.test(html || '');

  const enforceLtrOnEditor = (element: HTMLDivElement | null) => {
    if (!element) return;
    element.setAttribute('dir', 'ltr');
    element.style.direction = 'ltr';
    element.style.unicodeBidi = 'bidi-override';
    element.style.textAlign = 'left';

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    let current = walker.currentNode as HTMLElement | null;
    while (current) {
      if (current.getAttribute) {
        const dir = current.getAttribute('dir');
        if (dir && dir !== 'ltr') {
          current.setAttribute('dir', 'ltr');
        }
      }
      if (current instanceof HTMLElement) {
        if (current.style.direction === 'rtl') {
          current.style.direction = 'ltr';
        }
        if (current.style.unicodeBidi && current.style.unicodeBidi !== 'bidi-override') {
          current.style.unicodeBidi = 'bidi-override';
        }
        if (current.style.textAlign === 'right') {
          current.style.textAlign = 'left';
        }
      }
      current = walker.nextNode() as HTMLElement | null;
    }
  };

  const ensureLrmPrefix = (element: HTMLDivElement | null) => {
    if (!element) return;
    const text = element.textContent || '';
    if (text.startsWith('\u200E')) return;
    const lrmNode = document.createTextNode('\u200E');
    if (element.firstChild) {
      element.insertBefore(lrmNode, element.firstChild);
    } else {
      element.appendChild(lrmNode);
    }
  };

  const saveSignatureSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    signatureSelectionRef.current = selection.getRangeAt(0);
  };

  const restoreSignatureSelection = () => {
    const selection = window.getSelection();
    const range = signatureSelectionRef.current;
    if (!selection || !range) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };


  const moveCaretToEnd = (element: HTMLDivElement | null) => {
    if (!element) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const insertUploadingImage = (editorRef: React.RefObject<HTMLDivElement>, dataUrl: string, uploadId: string) => {
    const html = `<img src="${dataUrl}" data-upload-id="${uploadId}" style="display:block;max-width:140px;height:auto;margin:8px 0;" />`;
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const replaceUploadingImage = (editorRef: React.RefObject<HTMLDivElement>, uploadId: string, hostedUrl: string) => {
    if (!editorRef.current) return;
    const img = editorRef.current.querySelector(`img[data-upload-id="${uploadId}"]`) as HTMLImageElement | null;
    if (!img) return;
    img.src = hostedUrl;
    img.removeAttribute('data-upload-id');
  };

  const handlePasteToEditor = (
    event: React.ClipboardEvent<HTMLDivElement>,
    editorRef: React.RefObject<HTMLDivElement>,
    onUpdate: (html: string) => void,
    uploadImages = false
  ) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        hasImage = true;
        break;
      }
    }

    if (!hasImage) return;

    event.preventDefault();
    Array.from(items).forEach((item) => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) return;
        if (uploadImages) {
          const uploadId = `upload:${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const reader = new FileReader();
          reader.onload = () => {
            insertUploadingImage(editorRef, String(reader.result || ''), uploadId);
            if (editorRef.current) {
              onUpdate(editorRef.current.innerHTML);
            }
            beginUpload();
            mediaApi.uploadImage(file)
              .then((result) => {
                replaceUploadingImage(editorRef, uploadId, result.url);
                if (editorRef.current) {
                  onUpdate(editorRef.current.innerHTML);
                }
                endUpload();
              })
              .catch((err) => {
                console.error('Image upload failed:', err);
                setError('Image upload failed. Please try again; the image must be hosted for recipients to see it.');
                endUpload();
              });
          };
          reader.readAsDataURL(file);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            document.execCommand('insertImage', false, String(reader.result || ''));
            if (editorRef.current) {
              onUpdate(editorRef.current.innerHTML);
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          document.execCommand('insertText', false, text);
          if (editorRef.current) {
            onUpdate(editorRef.current.innerHTML);
          }
        });
      }
    });
  };


  const handleFileUpload = async (
    files: FileList | null,
    setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>
  ) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const loaded = await Promise.all(
      fileArray.map(
        (file) =>
          new Promise<AttachmentItem>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `${file.name}-${file.size}-${file.lastModified}`,
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                dataUrl: String(reader.result || ''),
                isImage: file.type.startsWith('image/'),
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

    setAttachments((prev) => [...prev, ...loaded]);
  };

  const handleSend = async () => {
    if (!toEmail || !subject || (!body && !bodyHtml)) {
      setError('Please fill in recipient email, subject, and message');
      return;
    }

    if (pendingUploads > 0) {
      setError('Please wait for image upload to finish before sending.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedSignature = signatures.find(s => s.id === selectedSignatureId);
      const baseBodyHtml = stripLrmFromHtml(bodyHtml || textToHtml(body));
      let hostedBodyHtml = baseBodyHtml;
      try {
        hostedBodyHtml = await ensureHostedImagesInHtml(baseBodyHtml);
      } catch (err) {
        throw new Error('Image upload failed. Please try again.');
      }
      let signatureHtml = '';
      if (includeSignature && selectedSignature?.html) {
        try {
          signatureHtml = await ensureHostedImagesInHtml(normalizeSignatureHtml(selectedSignature.html));
        } catch (err) {
          throw new Error('Signature image upload failed. Please try again.');
        }
      }
      const signatureHtmlBlock = signatureHtml ? `<br/><br/>${signatureHtml}` : '';
      const composedHtml = `${hostedBodyHtml}${signatureHtmlBlock}`;
      const finalHtml = buildHtmlBody(composedHtml, composeAttachments);
      const textBody = stripHtml(finalHtml);

      const result = await emailApi.send({
        toEmail,
        toName,
        subject,
        body: textBody,
        htmlBody: finalHtml,
        contactId: selectedContact?.id,
        organisationId: selectedContact?.organisationId,
      });

      if (result.success) {
        setSuccess(`Email sent successfully to ${toEmail}!`);
        clearRecipient();
        setSubject('');
        setBody('');
        setBodyHtml('');
        setComposeAttachments([]);
      } else {
        setError(result.message || 'Failed to send email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSend = async () => {
    if (selectedContactIds.size === 0) {
      setError('Please select at least one contact');
      return;
    }
    if (!bulkSubject || !bulkBody) {
      setError('Please fill in subject and message');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await emailApi.bulkSend({
        contactIds: Array.from(selectedContactIds),
        subject: bulkSubject,
        body: bulkBody,
        htmlBody: buildHtmlBody(bulkHtmlBody, bulkAttachments),
        campaignName: campaignName || undefined,
      });

      if (result.success) {
        setSuccess(`${result.message}${result.campaignId ? ' - Campaign created!' : ''}`);
        setSelectedContactIds(new Set());
        setBulkSubject('');
        setBulkBody('');
        setBulkHtmlBody('');
        setBulkAttachments([]);
        setCampaignName('');
      } else {
        setError(result.message || 'Failed to send emails');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSendViaTemplate = async () => {
    if (selectedContactIds.size === 0) {
      setError('Please select at least one contact');
      return;
    }

    if(selectedTemplateId === ""){
      setError('Please select a template');
      return;
    }

    const selectedTemplate = templates.find(
      (template) => template.id === selectedTemplateId
    );

    if (!selectedTemplate.subject || !selectedTemplate.body) {
      setError('Please fill in subject and message');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await emailApi.bulkSend({
        contactIds: Array.from(selectedContactIds),
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
        htmlBody: selectedTemplate.htmlBody || undefined,
        campaignName: campaignName || undefined,
      });

      if (result.success) {
        setSuccess(`${result.message}${result.campaignId ? ' - Campaign created!' : ''}`);
        setSelectedContactIds(new Set());
        setBulkSubject('');
        setBulkBody('');
        setBulkHtmlBody('');
        setBulkAttachments([]);
        setCampaignName('');
      } else {
        setError(result.message || 'Failed to send emails');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const toggleContactSelection = (id: string) => {
    const newSet = new Set(selectedContactIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContactIds(newSet);
  };

  const selectAllContacts = () => {
    if (selectedContactIds.size === allContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(allContacts.map(c => c.id)));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateSubject || !templateBody) {
      setError('Please fill in all template fields');
      return;
    }

    const selectedTemplateSignature = signatures.find(s => s.id === selectedTemplateSignatureId);
    const signatureHtmlBlock = includeTemplateSignature && selectedTemplateSignature?.html
      ? `<br/><br/>${selectedTemplateSignature.html}`
      : '';
    const composedTemplateHtml = `${templateHtmlBody || textToHtml(templateBody)}${signatureHtmlBlock}`;
    const composedTemplateBody = `${templateBody}${includeTemplateSignature && selectedTemplateSignature?.html ? `\n\n${stripHtml(selectedTemplateSignature.html)}` : ''}`;

    try {
      if (editingTemplate) {
        await templateApi.update(editingTemplate.id, {
          name: templateName,
          subject: templateSubject,
          body: composedTemplateBody,
          htmlBody: buildHtmlBody(composedTemplateHtml, templateAttachments),
        });
        setSuccess('Template updated!');
      } else {
        await templateApi.create({
          name: templateName,
          subject: templateSubject,
          body: composedTemplateBody,
          htmlBody: buildHtmlBody(composedTemplateHtml, templateAttachments),
        });
        setSuccess('Template created!');
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateSubject('');
      setTemplateBody('');
      setTemplateHtmlBody('');
      setTemplateAttachments([]);
      setIncludeTemplateSignature(false);
      setSelectedTemplateSignatureId('');
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await templateApi.delete(id);
      setSuccess('Template deleted');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    }
  };

  const useTemplate = (template: EmailTemplate) => {
    setActiveTab('compose');
    setSubject(template.subject);
    setBody(template.body);
    setBodyHtml(template.htmlBody || textToHtml(template.body || ''));
    setComposeAttachments([]);
    setSuccess(`Template "${template.name}" applied!`);
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setTemplateHtmlBody(template.htmlBody || '');
    setTemplateAttachments([]);
    setIncludeTemplateSignature(false);
    setSelectedTemplateSignatureId('');
    setShowTemplateModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={18} color="#00ff88" />;
      case 'opened':
      case 'clicked':
        return <CheckCircle size={18} color="#3b82f6" />;
      case 'failed':
      case 'bounced':
        return <AlertCircle size={18} color="#ef4444" />;
      default:
        return <Clock size={18} color="#6b7280" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const tabStyle = (tab: Tab) => ({
    padding: '12px 20px',
    backgroundColor: activeTab === tab ? '#00ff88' : '#1a2332',
    color: activeTab === tab ? '#0f1623' : 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#1a2332',
    border: '2px solid #2a3442',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  };

  const handleTemplateSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    
    const selectedOption = event.target.options[event.target.selectedIndex];
    setSelectedTemplateId(event.target.value);
    setSelectedTemplateName(selectedOption?.text);
    
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={28} color="#00ff88" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>Email Center</h1>
            <p style={{ color: '#9ca3af', fontSize: '16px', margin: '4px 0 0' }}>Send emails, manage templates, and track campaigns</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #1a2332', paddingBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('compose')} style={tabStyle('compose')}>
          <Send size={18} /> Compose
        </button>
        <button onClick={() => setActiveTab('bulkSend')} style={tabStyle('bulkSend')}>
          <Users size={18} /> Bulk Send
        </button>
        <button onClick={() => setActiveTab('templates')} style={tabStyle('templates')}>
          <FileText size={18} /> Templates
        </button>
        <button onClick={() => setActiveTab('campaigns')} style={tabStyle('campaigns')}>
          <BarChart3 size={18} /> Campaigns
        </button>
        <button onClick={() => setActiveTab('history')} style={tabStyle('history')}>
          <Clock size={18} /> History
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '16px' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#ef4444" />
          </button>
        </div>
      )}
      {success && (
        <div style={{ padding: '16px', backgroundColor: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={20} color="#00ff88" />
          <span style={{ color: '#00ff88', fontSize: '16px' }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#00ff88" />
          </button>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '24px' }}>Compose Email</h2>

          {/* Recipient */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Recipient</label>
            {selectedContact ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#1a2332', borderRadius: '8px' }}>
                <User size={20} color="#00ff88" />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '500' }}>{toName}</div>
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>{toEmail}</div>
                </div>
                <button onClick={clearRecipient} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} color="#9ca3af" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowContactPicker(!showContactPicker)}
                  style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer' }}
                >
                  <Search size={18} style={{ marginRight: '8px', opacity: 0.5 }} />
                  Search contacts or enter email...
                </button>
                {showContactPicker && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Type to search..."
                      style={inputStyle}
                      autoFocus
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => selectContact(contact)}
                          style={{ padding: '12px', backgroundColor: '#1a2332', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer' }}
                        >
                          <div style={{ color: 'white' }}>{contact.firstName} {contact.lastName}</div>
                          <div style={{ color: '#9ca3af', fontSize: '14px' }}>{contact.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="Or enter email directly"
                  style={{ ...inputStyle, marginTop: '8px' }}
                />
              </div>
            )}
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              style={inputStyle}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Message</label>
            <RichTextToolbar 
              editorRef={composeEditorRef} 
              onContentChange={(html) => {
                skipComposeSyncRef.current = true;
                setBodyHtml(html);
                setBody(stripHtml(html));
              }}
            />
            <div style={{ position: 'relative', border: '1px solid #2a3442', borderTop: 'none', borderRadius: '0 0 8px 8px', backgroundColor: '#1a2332' }}>
              {stripHtml(bodyHtml || '') === '' && (!composeEditorRef.current || composeEditorRef.current.innerText.replace(/\u200E/g, '').trim().length === 0) && (
                <div style={{ position: 'absolute', top: '12px', left: '16px', color: '#6b7280', pointerEvents: 'none', fontSize: '16px' }}>
                  Write your message... (paste images directly)
                </div>
              )}
              <div
                ref={composeEditorRef}
                contentEditable
                className="editor-ltr"
                dir="ltr"
                onBeforeInput={(e) => {
                  enforceLtrOnEditor(e.currentTarget);
                  ensureLrmPrefix(e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    document.execCommand('defaultParagraphSeparator', false, 'div');
                  }
                  enforceLtrOnEditor(e.currentTarget);
                  ensureLrmPrefix(e.currentTarget);
                  requestAnimationFrame(() => moveCaretToEnd(e.currentTarget));
                }}
                onFocus={(e) => {
                  enforceLtrOnEditor(e.currentTarget);
                  ensureLrmPrefix(e.currentTarget);
                  document.execCommand('defaultParagraphSeparator', false, 'div');
                  requestAnimationFrame(() => moveCaretToEnd(e.currentTarget));
                }}
                onInput={(e) => {
                  enforceLtrOnEditor(e.currentTarget);
                  ensureLrmPrefix(e.currentTarget);
                  const html = (e.currentTarget as HTMLDivElement).innerHTML;
                  skipComposeSyncRef.current = true;
                  setBodyHtml(html);
                  setBody(stripHtml(html));
                  requestAnimationFrame(() => moveCaretToEnd(e.currentTarget));
                }}
                onPaste={(e) => handlePasteToEditor(e, composeEditorRef, (html) => {
                  skipComposeSyncRef.current = true;
                  setBodyHtml(html);
                  setBody(stripHtml(html));
                  requestAnimationFrame(() => {
                    enforceLtrOnEditor(composeEditorRef.current);
                    ensureLrmPrefix(composeEditorRef.current);
                    moveCaretToEnd(composeEditorRef.current);
                  });
                }, true)}
                style={{
                  minHeight: '220px',
                  padding: '12px 16px',
                  overflowY: 'auto',
                  lineHeight: '1.5',
                  direction: 'ltr',
                  unicodeBidi: 'bidi-override',
                  textAlign: 'left',
                  writingMode: 'horizontal-tb',
                }}
                suppressContentEditableWarning
              />
            </div>
            {includeSignature && selectedSignatureId && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#0b1220', border: '1px solid #1f2a3a', borderRadius: '8px' }}>
                <div
                  style={{ color: 'white', fontSize: '14px' }}
                  dangerouslySetInnerHTML={{
                    __html: signatures.find(sig => sig.id === selectedSignatureId)?.html || '',
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
              />
              Add signature
            </label>
            <select
              value={selectedSignatureId}
              onChange={(e) => setSelectedSignatureId(e.target.value)}
              style={{ padding: '10px 12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white', minWidth: '200px' }}
            >
              <option value="">Select signature</option>
              {signatures.map(sig => (
                <option key={sig.id} value={sig.id}>{sig.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setEditingSignatureId(null);
                setSignatureName('');
                setSignatureHtml('');
                setShowSignatureModal(true);
              }}
              style={{ padding: '10px 14px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '8px', cursor: 'pointer' }}
            >
              Manage Signatures
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Attachments (images, PDFs, spreadsheets)</label>
            <input
              id="compose-attachments"
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files, setComposeAttachments)}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('compose-attachments')?.click()}
              style={{ padding: '12px 16px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Add Files
            </button>
            {composeAttachments.length > 0 && (
              <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '13px' }}>
                {composeAttachments.map((file) => (
                  <div key={file.id}>{file.name} ({Math.round(file.size / 1024)} KB)</div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: '14px 32px',
              backgroundColor: sending ? '#6b7280' : '#00ff88',
              color: '#0f1623',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Send size={20} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      )}

      {/* Bulk Send Tab */}
      {activeTab === 'bulkSend' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Contact Selection */}
          <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', color: 'white', margin: 0 }}>Select Recipients ({selectedContactIds.size} selected)</h2>
              <button onClick={selectAllContacts} style={{ padding: '8px 16px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                {selectedContactIds.size === allContacts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ ...inputStyle, marginBottom: '16px' }}
            >
              <option value="">All States</option>
              <option value="NSW">NSW</option>
              <option value="VIC">VIC</option>
              <option value="QLD">QLD</option>
              <option value="WA">WA</option>
              <option value="SA">SA</option>
              <option value="TAS">TAS</option>
              <option value="NT">NT</option>
              <option value="ACT">ACT</option>
            </select>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading contacts...</div>
              ) : (
                allContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleContactSelection(contact.id)}
                    style={{
                      padding: '12px',
                      backgroundColor: selectedContactIds.has(contact.id) ? 'rgba(0, 255, 136, 0.1)' : '#1a2332',
                      border: selectedContactIds.has(contact.id) ? '1px solid #00ff88' : '1px solid transparent',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => { }}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ color: 'white', fontWeight: '500' }}>{contact.firstName} {contact.lastName}</div>
                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>{contact.email}</div>
                        {contact.organisationName && (
                          <div style={{ color: '#6b7280', fontSize: '12px' }}>{contact.organisationName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr style={{ borderTop: "2px solid #ccc", margin: "20px 0" }} />

            <div style={{ marginBottom: '16px', marginTop: '16px' }}>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateSelection}
                style={{ ...inputStyle, marginBottom: '16px' }}
              >
                <option value="">Select a template</option>

                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>

              <button
              onClick={handleBulkSendViaTemplate}
              disabled={sending || selectedTemplateId === ""}
              style={{
                padding: '14px 32px',
                backgroundColor: sending || selectedTemplateId === "" ? '#6b7280' : '#00ff88',
                color: '#0f1623',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: sending || selectedTemplateId === "" ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={20} />
              {sending ? 'Sending...' : `Send via Selected Template [ ${ selectedTemplateName } ]`}
            </button>

            </div>

          </div>

          {/* Email Compose */}
          <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '16px' }}>Compose Bulk Email</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Campaign Name (optional)</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., December Newsletter"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Subject</label>
              <input
                type="text"
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
                placeholder="Email subject (use {{firstName}} for personalization)"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Message</label>
              <RichTextToolbar 
                editorRef={bulkEditorRef} 
                onContentChange={(html) => {
                  setBulkHtmlBody(html);
                  setBulkBody(stripHtml(html));
                }}
              />
              <div style={{ position: 'relative', border: '1px solid #2a3442', borderTop: 'none', borderRadius: '0 0 8px 8px', backgroundColor: '#1a2332' }}>
                {!bulkHtmlBody && (
                  <div style={{ position: 'absolute', top: '12px', left: '16px', color: '#6b7280', pointerEvents: 'none', fontSize: '16px' }}>
                    Hi {'{{firstName}}'},<br/>Write your message here... (paste images directly)
                  </div>
                )}
                <div
                  ref={bulkEditorRef}
                  contentEditable
                  dir="ltr"
                  onInput={(e) => {
                    const html = (e.currentTarget as HTMLDivElement).innerHTML;
                    setBulkHtmlBody(html);
                    setBulkBody(stripHtml(html));
                  }}
                  onPaste={(e) => handlePasteToEditor(e, bulkEditorRef, (html) => {
                    setBulkHtmlBody(html);
                    setBulkBody(stripHtml(html));
                  })}
                  style={{
                    minHeight: '200px',
                    padding: '12px 16px',
                    overflowY: 'auto',
                    lineHeight: '1.5',
                    direction: 'ltr',
                    color: 'white',
                    outline: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: bulkHtmlBody }}
                />
              </div>
              <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{jobTitle}}'}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Attachments (images, PDFs, spreadsheets)</label>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files, setBulkAttachments)}
                style={{ color: 'white' }}
              />
              {bulkAttachments.length > 0 && (
                <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '13px' }}>
                  {bulkAttachments.map((file) => (
                    <div key={file.id}>{file.name} ({Math.round(file.size / 1024)} KB)</div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBulkSend}
              disabled={sending || selectedContactIds.size === 0}
              style={{
                padding: '14px 32px',
                backgroundColor: sending || selectedContactIds.size === 0 ? '#6b7280' : '#00ff88',
                color: '#0f1623',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: sending || selectedContactIds.size === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={20} />
              {sending ? 'Sending...' : `Send to ${selectedContactIds.size} Contact${selectedContactIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'white', margin: 0 }}>Email Templates</h2>
            <button
              onClick={() => { setShowTemplateModal(true); setEditingTemplate(null); }}
              style={{ padding: '12px 24px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> New Template
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No templates yet. Create one to get started!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {templates.map((template) => (
                <div key={template.id} style={{ backgroundColor: '#1a2332', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>{template.name}</h3>
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}><strong>Subject:</strong> {template.subject}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px', maxHeight: '60px', overflow: 'hidden' }}>{template.body.substring(0, 100)}...</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => useTemplate(template)} style={{ flex: 1, padding: '8px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Use</button>
                    <button onClick={() => editTemplate(template)} style={{ padding: '8px 12px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '6px', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button onClick={() => handleDeleteTemplate(template.id)} style={{ padding: '8px 12px', backgroundColor: '#1a2332', color: '#ef4444', border: '1px solid #2a3442', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Modal */}
          {showTemplateModal && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflow: 'hidden' }} onClick={(e) => { if (e.target === e.currentTarget) { setShowTemplateModal(false); setEditingTemplate(null); } }}>
              <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '24px' }}>{editingTemplate ? 'Edit Template' : 'New Template'}</h2>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Template Name</label>
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Welcome Email" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Subject</label>
                  <input type="text" value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="Email subject" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Body</label>
                  <RichTextToolbar 
                    editorRef={templateEditorRef} 
                    onContentChange={(html) => {
                      setTemplateHtmlBody(html);
                      setTemplateBody(stripHtml(html));
                    }}
                  />
                  <div style={{ position: 'relative', border: '1px solid #2a3442', borderTop: 'none', borderRadius: '0 0 8px 8px', backgroundColor: '#1a2332' }}>
                    {!templateHtmlBody && (!templateEditorRef.current || templateEditorRef.current.innerText.trim().length === 0) && (
                      <div style={{ position: 'absolute', top: '12px', left: '16px', color: '#6b7280', pointerEvents: 'none', fontSize: '16px' }}>
                        Write your template... (paste images directly)
                      </div>
                    )}
                    <div
                      ref={templateEditorRef}
                      contentEditable
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.execCommand('insertLineBreak');
                          const html = (e.currentTarget as HTMLDivElement).innerHTML;
                          setTemplateHtmlBody(html);
                          setTemplateBody(stripHtml(html));
                        }
                      }}
                      onInput={(e) => {
                        const html = (e.currentTarget as HTMLDivElement).innerHTML;
                        setTemplateHtmlBody(html);
                        setTemplateBody(stripHtml(html));
                      }}
                      onPaste={(e) => handlePasteToEditor(e, templateEditorRef, (html) => {
                        setTemplateHtmlBody(html);
                        setTemplateBody(stripHtml(html));
                      })}
                      style={{
                        minHeight: '220px',
                        maxHeight: '300px',
                        padding: '12px 16px',
                        overflowY: 'auto',
                        lineHeight: '1.5',
                        direction: 'ltr',
                        unicodeBidi: 'embed',
                        textAlign: 'left',
                        writingMode: 'horizontal-tb',
                        color: 'white',
                        outline: 'none',
                      }}
                      dangerouslySetInnerHTML={{ __html: templateHtmlBody || textToHtml(templateBody || '') }}
                    />
                  </div>
                  {includeTemplateSignature && selectedTemplateSignatureId && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#0b1220', border: '1px solid #1f2a3a', borderRadius: '8px' }}>
                      <div
                        style={{ color: 'white', fontSize: '14px' }}
                        dangerouslySetInnerHTML={{
                          __html: signatures.find(sig => sig.id === selectedTemplateSignatureId)?.html || '',
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={includeTemplateSignature}
                      onChange={(e) => setIncludeTemplateSignature(e.target.checked)}
                    />
                    Add signature
                  </label>
                  <select
                    value={selectedTemplateSignatureId}
                    onChange={(e) => setSelectedTemplateSignatureId(e.target.value)}
                    style={{ padding: '10px 12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white', minWidth: '200px' }}
                  >
                    <option value="">Select signature</option>
                    {signatures.map(sig => (
                      <option key={sig.id} value={sig.id}>{sig.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSignatureId(null);
                      setSignatureName('');
                      setSignatureHtml('');
                      setShowSignatureModal(true);
                    }}
                    style={{ padding: '10px 14px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Manage Signatures
                  </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Attachments (images, PDFs, spreadsheets)</label>
                  <input
                    id="template-attachments"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, setTemplateAttachments)}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('template-attachments')?.click()}
                    style={{ padding: '12px 16px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Plus size={16} /> Add Files
                  </button>
                  {templateAttachments.length > 0 && (
                    <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '13px' }}>
                      {templateAttachments.map((file) => (
                        <div key={file.id}>{file.name} ({Math.round(file.size / 1024)} KB)</div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); setIncludeTemplateSignature(false); setSelectedTemplateSignatureId(''); }} style={{ padding: '12px 24px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveTemplate} style={{ padding: '12px 24px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{editingTemplate ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'white', margin: 0 }}>Campaign Analytics</h2>
            <button onClick={loadCampaigns} style={{ padding: '8px 16px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No campaigns yet. Send a bulk email with a campaign name to create one!</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a3442' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Campaign</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Sent</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Opened</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Clicked</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Bounced</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#9ca3af', fontSize: '14px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid #1a2332' }}>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ color: 'white', fontWeight: '500' }}>{campaign.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '13px' }}>{campaign.subject}</div>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', backgroundColor: campaign.status === 'sent' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(234, 179, 8, 0.1)', color: campaign.status === 'sent' ? '#00ff88' : '#eab308', borderRadius: '12px', fontSize: '13px' }}>
                          {campaign.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', color: 'white' }}>{campaign.sentCount}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span style={{ color: '#3b82f6' }}>{campaign.openedCount}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}> ({campaign.openRate}%)</span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span style={{ color: '#00ff88' }}>{campaign.clickedCount}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}> ({campaign.clickRate}%)</span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', color: '#ef4444' }}>{campaign.bouncedCount}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', color: '#9ca3af', fontSize: '14px' }}>{formatDate(campaign.sentAt || campaign.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'white', margin: 0 }}>Sent Emails</h2>
            <button onClick={loadHistory} style={{ padding: '8px 16px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {historyLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : sentEmails.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No emails sent yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a3442' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Recipient</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#9ca3af', fontSize: '14px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sentEmails.map((email) => (
                    <tr key={email.id} style={{ borderBottom: '1px solid #1a2332' }}>
                      <td style={{ padding: '16px 12px' }}>{getStatusIcon(email.status)}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ color: 'white' }}>{email.toName || email.toEmail}</div>
                        {email.toName && <div style={{ color: '#6b7280', fontSize: '13px' }}>{email.toEmail}</div>}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#9ca3af' }}>{email.subject}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>{formatDate(email.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Signature Manager Modal */}
      {showSignatureModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', margin: 0 }}>Signatures</h2>
              <button onClick={() => setShowSignatureModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Signature Name</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g., Default Signature"
                style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Signature Content (paste images)</label>
              {pendingUploads > 0 && (
                <div style={{ marginBottom: '8px', color: '#f59e0b', fontSize: '12px' }}>
                  Uploading images... please wait before saving.
                </div>
              )}
              <RichTextToolbar 
                editorRef={signatureEditorRef} 
                onContentChange={(html) => {
                  skipSignatureSyncRef.current = true;
                  setSignatureHtml(html);
                }}
              />
              <div
                ref={signatureEditorRef}
                contentEditable
                dir="ltr"
                onFocus={saveSignatureSelection}
                onKeyUp={saveSignatureSelection}
                onMouseUp={saveSignatureSelection}
                onInput={(e) => {
                  skipSignatureSyncRef.current = true;
                  setSignatureHtml((e.currentTarget as HTMLDivElement).innerHTML);
                }}
                onPaste={(e) => handlePasteToEditor(e, signatureEditorRef, (html) => {
                  skipSignatureSyncRef.current = true;
                  setSignatureHtml(html);
                }, true)}
                style={{
                  minHeight: '140px',
                  padding: '12px',
                  backgroundColor: '#1a2332',
                  border: '1px solid #2a3442',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  color: 'white',
                  lineHeight: '1.5',
                  direction: 'ltr',
                  unicodeBidi: 'embed',
                  textAlign: 'left',
                  writingMode: 'horizontal-tb',
                  outline: 'none',
                }}
                suppressContentEditableWarning
              />
            </div>

            <div style={{ marginBottom: '12px', color: '#9ca3af', fontSize: '12px' }}>
              Pasted images are automatically hosted so they display properly in email clients.
            </div>


            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={async () => {
                  if (!signatureName.trim()) {
                    setError('Signature name is required');
                    return;
                  }
                  // Still uploading? Just warn but allow save
                  if (pendingUploads > 0) {
                    setError('Images are still uploading. Please wait a moment.');
                    return;
                  }
                  const cleanedSignatureHtml = normalizeSignatureHtml(signatureHtml);
                  let hostedSignatureHtml = cleanedSignatureHtml;
                  // Try to upload any remaining base64 images
                  try {
                    hostedSignatureHtml = await ensureHostedImagesInHtml(cleanedSignatureHtml);
                  } catch (err) {
                    // If upload fails, still save with base64 (will show warning)
                    console.warn('Image upload failed, saving with embedded images:', err);
                    hostedSignatureHtml = cleanedSignatureHtml;
                  }
                  if (editingSignatureId) {
                    setSignatures(prev => prev.map(sig => sig.id === editingSignatureId ? { ...sig, name: signatureName, html: hostedSignatureHtml } : sig));
                  } else {
                    setSignatures(prev => [...prev, { id: `sig:${Date.now()}`, name: signatureName, html: hostedSignatureHtml }]);
                  }
                  setSignatureName('');
                  setSignatureHtml('');
                  setEditingSignatureId(null);
                  setSuccess('Signature saved!');
                  setTimeout(() => setSuccess(null), 3000);
                }}
                style={{ padding: '10px 16px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                {editingSignatureId ? 'Update Signature' : 'Save Signature'}
              </button>
              <button
                onClick={() => {
                  setSignatureName('');
                  setSignatureHtml('');
                  setEditingSignatureId(null);
                }}
                style={{ padding: '10px 16px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '8px', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>

            {signatures.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '8px' }}>Saved Signatures</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {signatures.map(sig => (
                    <div key={sig.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>{sig.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: sig.html }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingSignatureId(sig.id);
                            setSignatureName(sig.name);
                            setSignatureHtml(sig.html);
                          }}
                          style={{ padding: '6px 10px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSignatures(prev => prev.filter(s => s.id !== sig.id))}
                          style={{ padding: '6px 10px', backgroundColor: '#1a2332', color: '#ef4444', border: '1px solid #2a3442', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
