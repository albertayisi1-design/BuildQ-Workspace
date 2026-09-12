import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  FolderArchive,
  Layers,
  HelpCircle,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  ANDROID_CONFIG,
  downloadAndroidApk,
  downloadAndroidProjectZip,
  generateQrCodeSvg,
} from '../../utils/androidPackageGenerator';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isStandalone, install } = usePWAInstall();
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : ANDROID_CONFIG.appUrl;

  const handleInstallClick = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      alert('BuildIQ has been added to your Android home screen and app launcher!');
    }
  };

  const handleDownloadApk = async () => {
    setDownloadingApk(true);
    try {
      const res = await downloadAndroidApk();
      setLastDownloaded(`${res.fileName} (${res.size})`);
    } catch (err) {
      console.error('Error generating APK:', err);
    } finally {
      setDownloadingApk(false);
    }
  };

  const handleDownloadProjectZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await downloadAndroidProjectZip();
      setLastDownloaded(`${res.fileName} (${res.size})`);
    } catch (err) {
      console.error('Error generating Android project:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      id="modal-android-app"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Formal Civil Brand Styling */}
        <div className="bg-slate-900 p-6 text-white relative flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  LOGICA Civil for Android
                </h2>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono font-bold border border-slate-700">
                  v{ANDROID_CONFIG.versionName}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-mono font-bold">
                  Release Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Install on Android phones and rugged field tablets for jobsite tracking, offline site diaries, and receipt camera capture.
              </p>
            </div>
          </div>
          <button
            id="btn-close-android-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Status Alert if Downloaded */}
          {lastDownloaded && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Downloaded successfully: <strong>{lastDownloaded}</strong>. Follow the sideloading guide below to install on your Android device.
              </span>
            </div>
          )}

          {/* 3 Primary Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Direct Android PWA/WebAPK Install */}
            <div className="p-5 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                    Recommended
                  </span>
                  <span className="text-xs text-slate-500 font-mono">WebAPK / PWA</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Instant Android Install
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Adds BuildIQ directly to your Android app drawer and home screen. Launches fullscreen with zero app store delays, automatic updates, and offline storage.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/50">
                {isStandalone || isInstalled ? (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/60 p-2.5 rounded-lg text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Installed & Active in Standalone Mode</span>
                  </div>
                ) : canInstall ? (
                  <button
                    id="btn-install-pwa-now"
                    onClick={handleInstallClick}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-md text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-950"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Install on Android Now</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleInstallClick}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-md text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-950"
                    >
                      <Smartphone className="w-4 h-4 text-white" />
                      <span>Trigger Android Install Prompt</span>
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Tip: In Chrome on Android, tap <strong>⋮ &gt; Install App</strong> or <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: Download Signed Android APK File */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    Standalone Sideload
                  </span>
                  <span className="text-xs text-slate-500 font-mono">.APK Package</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-700" />
                  Download Android APK
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Download the standalone Android package installer file for offline deployment, MDM device staging, or direct sideloading onto company phones.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <button
                  id="btn-download-apk"
                  onClick={handleDownloadApk}
                  disabled={downloadingApk}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-md text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-slate-950"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{downloadingApk ? 'Generating APK Package...' : 'Download CivilOps.apk (Release)'}</span>
                </button>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Package: ca.buildiq.mobile</span>
                  <span>Target: Android 14 (SDK 34)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 3: Full Android Studio / TWA Source Project Bundle */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Android Studio &amp; Gradle Project (.zip)</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">Developers</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Contains complete Gradle project, `AndroidManifest.xml`, Kotlin `MainActivity.kt`, and `assetlinks.json` ready for Play Store compilation.
                </p>
              </div>
            </div>
            <button
              id="btn-download-android-project"
              onClick={handleDownloadProjectZip}
              disabled={downloadingZip}
              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold py-2 px-3.5 rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{downloadingZip ? 'Packaging...' : 'Download Project Zip'}</span>
            </button>
          </div>

          {/* Mobile QR Code Scanner Section */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="sm:col-span-1 flex flex-col items-center justify-center">
              <div
                className="w-36 h-36 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(currentUrl, 140) }}
              />
              <span className="text-[11px] text-slate-400 font-mono mt-1 text-center">
                Scan with Android Camera
              </span>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Open Directly on Mobile Device</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan the QR code with any Android phone camera or barcode scanner to load the application instantly. You will be prompted to add BuildIQ to your device.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-700 select-all"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Android Sideloading & Installation Instructions */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                Android Sideloading &amp; Installation Instructions
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Android 9.0 – 15+</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  1
                </div>
                <div className="font-bold text-slate-900">Download APK / Open URL</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Click 'Download CivilOps.apk' above or scan the QR code using your Android camera or mobile Chrome browser.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  2
                </div>
                <div className="font-bold text-slate-900">Allow Unknown Apps</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  When tapping the downloaded APK, if Android prompts with 'Security warning', tap <strong>Settings</strong> and toggle on <strong>Allow from this source</strong>.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  3
                </div>
                <div className="font-bold text-slate-900">Install &amp; Launch</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tap <strong>Install</strong>. Once complete, find the <strong>LOGICA Civil</strong> icon in your app drawer to start managing construction finances on site!
                </p>
              </div>
            </div>
          </div>

          {/* Security & Verification Metadata */}
          <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Package SHA-256 Fingerprint: <code className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{ANDROID_CONFIG.sha256Fingerprint.slice(0, 32)}...</code>
              </span>
            </div>
            <span className="font-mono text-slate-600">Encrypted HTTPS &amp; Offline Sync</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            BuildIQ Mobile Division &bull; Canadian Construction Technology
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
