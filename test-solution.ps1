# Script de test pour vérifier la solution
Write-Host "🧪 Test de la solution boat.html" -ForegroundColor Green

# 1. Vérifier que le serveur API fonctionne
Write-Host "`n1. Test du serveur API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Serveur API fonctionne sur le port 3000" -ForegroundColor Green
    } else {
        Write-Host "❌ Serveur API répond avec le code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Serveur API non accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Démarrez le serveur avec: node mock-api-server.cjs" -ForegroundColor Cyan
}

# 2. Test de l'endpoint bateau
Write-Host "`n2. Test de l'endpoint bateau..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/boats/68c717e123456789abcdef01" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.success -and $data.data.boat) {
            Write-Host "✅ Endpoint bateau fonctionne - Bateau trouvé: $($data.data.boat.name)" -ForegroundColor Green
        } else {
            Write-Host "❌ Réponse API invalide" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Endpoint bateau répond avec le code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur lors du test de l'endpoint bateau: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test avec ID invalide
Write-Host "`n3. Test avec ID invalide..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/boats/invalid-id" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 400) {
        Write-Host "✅ Validation ID fonctionne (400 pour ID invalide)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Code de réponse inattendu: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors du test ID invalide: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Démarrez Vite: npm run dev" -ForegroundColor White
Write-Host "2. Ouvrez: http://localhost:5173/test-boat-page.html" -ForegroundColor White
Write-Host "3. Testez les liens de la page de test" -ForegroundColor White
Write-Host "4. Vérifiez que la page boat.html s'affiche correctement" -ForegroundColor White
