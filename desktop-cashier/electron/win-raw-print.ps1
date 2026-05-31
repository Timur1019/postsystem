# RAW ESC/POS в очередь Windows (Xprinter POS-80 и др.)
param(
  [Parameter(Mandatory = $true)][string]$PrinterName,
  [Parameter(Mandatory = $true)][string]$FilePath
)

$ErrorActionPreference = 'Stop'
$bytes = [System.IO.File]::ReadAllBytes($FilePath)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class AurentRawPrinter {
  [DllImport("winspool.drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
  public class DOCINFOA {
    public string pDocName;
    public string pOutputFile;
    public string pDataType;
  }
  public static void Send(string printerName, byte[] data) {
    IntPtr h;
    if (!OpenPrinter(printerName, out h, IntPtr.Zero)) {
      throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "OpenPrinter failed");
    }
    try {
      var di = new DOCINFOA { pDocName = "Aurent", pDataType = "RAW" };
      if (!StartDocPrinter(h, 1, di)) {
        throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "StartDocPrinter failed");
      }
      try {
        if (!StartPagePrinter(h)) {
          throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "StartPagePrinter failed");
        }
        try {
          IntPtr buf = Marshal.AllocCoTaskMem(data.Length);
          try {
            Marshal.Copy(data, 0, buf, data.Length);
            int written;
            if (!WritePrinter(h, buf, data.Length, out written) || written != data.Length) {
              throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "WritePrinter failed");
            }
          } finally {
            Marshal.FreeCoTaskMem(buf);
          }
        } finally {
          EndPagePrinter(h);
        }
      } finally {
        EndDocPrinter(h);
      }
    } finally {
      ClosePrinter(h);
    }
  }
}
"@

[AurentRawPrinter]::Send($PrinterName, $bytes)
