use std::path::PathBuf;

fn main() {
    // Determine which .env file to load based on build profile
    let profile = std::env::var("PROFILE").unwrap_or_default();
    let env_file = if profile == "release" {
        "../.env.production"
    } else {
        "../.env"
    };

    let env_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(env_file);

    if env_path.exists() {
        let _ = dotenvy::from_path(&env_path);
    }

    let hub_url = std::env::var("VITE_HUB_URL")
        .unwrap_or_else(|_| "http://hub.local.test".to_string());

    println!("cargo:rustc-env=HUB_URL={}", hub_url);

    tauri_build::build()
}
