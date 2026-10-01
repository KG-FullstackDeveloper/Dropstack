$ErrorActionPreference = "Stop"

$path = Join-Path $PSScriptRoot "..\client\src\pages\Admin.tsx"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Admin.tsx was not found at: $path"
}

$content = Get-Content -LiteralPath $path -Raw
$newline = [Environment]::NewLine

# Add the page import once.
if ($content -notmatch 'import FulfillmentCenter from "\./admin/FulfillmentCenter";') {
    $anchor = 'import Orders from "./admin/Orders";'
    if ($content.Contains($anchor)) {
        $content = $content.Replace(
            $anchor,
            $anchor + $newline + 'import FulfillmentCenter from "./admin/FulfillmentCenter";'
        )
    } else {
        throw "Could not find the Orders import in Admin.tsx. No changes were written."
    }
}

# Add PackageCheck only when it is not already imported.
if ($content -notmatch '\bPackageCheck\b') {
    $packageAnchor = '  Package,'
    if ($content.Contains($packageAnchor)) {
        $content = $content.Replace(
            $packageAnchor,
            $packageAnchor + $newline + '  PackageCheck,'
        )
    } else {
        $packageAnchor = 'Package,'
        if ($content.Contains($packageAnchor)) {
            $content = $content.Replace(
                $packageAnchor,
                $packageAnchor + $newline + 'PackageCheck,'
            )
        } else {
            throw "Could not find the Package icon import in Admin.tsx. No changes were written."
        }
    }
}

# Add the navigation item after Orders.
if ($content -notmatch '\{\s*label:\s*"Fulfillment",\s*icon:\s*PackageCheck\s*\}') {
    $navAnchor = '{ label: "Orders", icon: ShoppingCart },'
    if ($content.Contains($navAnchor)) {
        $content = $content.Replace(
            $navAnchor,
            $navAnchor + $newline + '{ label: "Fulfillment", icon: PackageCheck },'
        )
    } else {
        throw "Could not find the Orders navigation item in Admin.tsx. No changes were written."
    }
}

# Add the render case once.
if ($content -notmatch 'case "Fulfillment":') {
    $caseAnchor = 'case "Orders":'
    if ($content.Contains($caseAnchor)) {
        $replacement = $caseAnchor + $newline + 'return <Orders />;' + $newline + $newline + 'case "Fulfillment":' + $newline + 'return <FulfillmentCenter />;'
        $content = $content.Replace(
            $caseAnchor + $newline + 'return <Orders />;',
            $replacement
        )
    } else {
        throw "Could not find the Orders render case in Admin.tsx. No changes were written."
    }
}

Set-Content -LiteralPath $path -Value $content -Encoding UTF8
Write-Host "Fulfillment Center was added to Admin.tsx." -ForegroundColor Green
Write-Host "Next: run the client build from the client folder." -ForegroundColor Cyan
