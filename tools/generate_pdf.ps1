$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$inputFile = Join-Path $root "docs\multiplayer-gaming-site-100-steps.md"
$outputFile = Join-Path $root "docs\multiplayer-gaming-site-100-steps.pdf"

function Escape-PdfText {
    param([string]$Text)
    return $Text.Replace('\', '\\').Replace('(', '\(').Replace(')', '\)')
}

function Wrap-Line {
    param(
        [string]$Text,
        [int]$Width = 90
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return @("")
    }

    $words = $Text -split '\s+'
    $lines = New-Object System.Collections.Generic.List[string]
    $current = ""

    foreach ($word in $words) {
        if ([string]::IsNullOrEmpty($current)) {
            $current = $word
            continue
        }

        if (($current.Length + 1 + $word.Length) -le $Width) {
            $current = "$current $word"
        } else {
            $lines.Add($current)
            $current = $word
        }
    }

    if (-not [string]::IsNullOrEmpty($current)) {
        $lines.Add($current)
    }

    return $lines
}

function Convert-MarkdownToLines {
    param([string]$Markdown)

    $result = New-Object System.Collections.Generic.List[string]

    foreach ($raw in ($Markdown -split "`r?`n")) {
        $line = $raw.Trim()

        if ($line.Length -eq 0) {
            $result.Add("")
            continue
        }

        if ($line.StartsWith("# ")) {
            $result.Add($line.Substring(2).ToUpperInvariant())
            $result.Add("")
            continue
        }

        if ($line.StartsWith("## ")) {
            $result.Add($line.Substring(3).ToUpperInvariant())
            continue
        }

        if ($line.StartsWith("- ")) {
            foreach ($wrapped in (Wrap-Line -Text ("* " + $line.Substring(2)))) {
                $result.Add($wrapped)
            }
            continue
        }

        foreach ($wrapped in (Wrap-Line -Text $line)) {
            $result.Add($wrapped)
        }
    }

    return $result
}

function Add-PdfObject {
    param(
        [System.Collections.Generic.List[byte[]]]$Objects,
        [string]$Data
    )

    $bytes = [System.Text.Encoding]::ASCII.GetBytes($Data)
    $Objects.Add($bytes)
    return $Objects.Count
}

$markdown = Get-Content $inputFile -Raw -Encoding UTF8
$lines = Convert-MarkdownToLines -Markdown $markdown

$pageWidth = 612
$pageHeight = 792
$marginLeft = 50
$marginTop = 50
$lineHeight = 14
$usableHeight = $pageHeight - ($marginTop * 2)
$linesPerPage = [math]::Floor($usableHeight / $lineHeight)

$pages = New-Object System.Collections.Generic.List[object]
$currentPage = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    $currentPage.Add($line)
    if ($currentPage.Count -ge $linesPerPage) {
        $pages.Add(@($currentPage.ToArray()))
        $currentPage = New-Object System.Collections.Generic.List[string]
    }
}

if ($currentPage.Count -gt 0) {
    $pages.Add(@($currentPage.ToArray()))
}

$objects = New-Object 'System.Collections.Generic.List[byte[]]'
$fontId = Add-PdfObject -Objects $objects -Data '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

$contentIds = New-Object System.Collections.Generic.List[int]
$pageIds = New-Object System.Collections.Generic.List[int]

foreach ($page in $pages) {
    $commands = New-Object System.Collections.Generic.List[string]
    $commands.Add("BT")
    $commands.Add("/F1 11 Tf")
    $commands.Add("$marginLeft $($pageHeight - $marginTop) Td")
    $commands.Add("$lineHeight TL")

    $first = $true
    foreach ($line in $page) {
        $escaped = Escape-PdfText -Text $line
        if ($first) {
            $commands.Add("($escaped) Tj")
            $first = $false
        } else {
            $commands.Add("T*")
            $commands.Add("($escaped) Tj")
        }
    }

    $commands.Add("ET")
    $stream = [string]::Join("`n", $commands)
    $streamBytes = [System.Text.Encoding]::ASCII.GetBytes($stream)
    $contentData = "<< /Length $($streamBytes.Length) >>`nstream`n$stream`nendstream"
    $contentId = Add-PdfObject -Objects $objects -Data $contentData
    $contentIds.Add($contentId)

    $pageData = "<< /Type /Page /Parent 0 0 R /MediaBox [0 0 $pageWidth $pageHeight] /Resources << /Font << /F1 $fontId 0 R >> >> /Contents $contentId 0 R >>"
    $pageId = Add-PdfObject -Objects $objects -Data $pageData
    $pageIds.Add($pageId)
}

$kids = [string]::Join(" ", ($pageIds | ForEach-Object { "$_ 0 R" }))
$pagesId = Add-PdfObject -Objects $objects -Data "<< /Type /Pages /Kids [$kids] /Count $($pageIds.Count) >>"

foreach ($pageId in $pageIds) {
    $index = $pageId - 1
    $text = [System.Text.Encoding]::ASCII.GetString($objects[$index])
    $text = $text.Replace("/Parent 0 0 R", "/Parent $pagesId 0 R")
    $objects[$index] = [System.Text.Encoding]::ASCII.GetBytes($text)
}

$catalogId = Add-PdfObject -Objects $objects -Data "<< /Type /Catalog /Pages $pagesId 0 R >>"

$builder = New-Object System.Text.StringBuilder
[void]$builder.Append("%PDF-1.4`n")

$offsets = New-Object System.Collections.Generic.List[int]
$offsets.Add(0)

for ($i = 0; $i -lt $objects.Count; $i++) {
    $offsets.Add($builder.Length)
    [void]$builder.Append("$($i + 1) 0 obj`n")
    [void]$builder.Append([System.Text.Encoding]::ASCII.GetString($objects[$i]))
    [void]$builder.Append("`nendobj`n")
}

$xrefOffset = $builder.Length
[void]$builder.Append("xref`n0 $($objects.Count + 1)`n")
[void]$builder.Append("0000000000 65535 f `n")

for ($i = 1; $i -lt $offsets.Count; $i++) {
    [void]$builder.Append(("{0:D10} 00000 n `n" -f $offsets[$i]))
}

[void]$builder.Append("trailer`n<< /Size $($objects.Count + 1) /Root $catalogId 0 R >>`n")
[void]$builder.Append("startxref`n$xrefOffset`n%%EOF")

[System.IO.File]::WriteAllBytes($outputFile, [System.Text.Encoding]::ASCII.GetBytes($builder.ToString()))
Write-Output "Created $outputFile"
