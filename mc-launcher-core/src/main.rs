use serde::Deserialize;
use std::fs::{self, File};
use std::io::copy;
use std::path::Path;
use zip::ZipArchive;

#[derive(Deserialize, Debug)]
struct VersionEntry {
    id: String,
    #[serde(rename = "type")]
    version_type: String,
    url: String,
}

#[derive(Deserialize, Debug)]
struct VersionManifest {
    versions: Vec<VersionEntry>,
}

#[derive(Deserialize, Debug)]
struct VersionDetails {
    #[serde(rename = "mainClass")]
    main_class: String,
    libraries: Vec<Library>,
}

#[derive(Deserialize, Debug)]
struct Library {
    name: String,
    downloads: LibraryDownloads,
    rules: Option<Vec<Rule>>,
}

#[derive(Deserialize, Debug)]
struct Rule {
    action: String,
    os: Option<OsInfo>,
}

#[derive(Deserialize, Debug)]
struct OsInfo {
    name: Option<String>,
}

#[derive(Deserialize, Debug)]
struct LibraryDownloads {
    artifact: Option<Artifact>,
}

#[derive(Deserialize, Debug)]
struct Artifact {
    path: String,
    url: String,
    #[allow(dead_code)]
    sha1: String,
    size: u64,
}

fn current_os_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "osx"
    } else {
        "linux"
    }
}

fn applies_to_current_os(rules: &Option<Vec<Rule>>) -> bool {
    let rules = match rules {
        Some(r) => r,
        None => return true,
    };

    let mut allowed = false;
    for rule in rules {
        let os_matches = match &rule.os {
            None => true,
            Some(os) => match &os.name {
                Some(name) => name == current_os_name(),
                None => true,
            },
        };
        if os_matches {
            allowed = rule.action == "allow";
        }
    }
    allowed
}

fn is_our_native_library(name: &str) -> bool {
    name.ends_with(":natives-windows")
}

fn extract_natives(jar_path: &str, out_dir: &str) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(jar_path)?;
    let mut archive = ZipArchive::new(file)?;

    fs::create_dir_all(out_dir)?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let entry_name = entry.name().to_string();

        if !entry_name.ends_with(".dll") {
            continue;
        }

        let file_name = Path::new(&entry_name).file_name().unwrap();
        let out_path = Path::new(out_dir).join(file_name);

        let mut out_file = File::create(out_path)?;
        copy(&mut entry, &mut out_file)?;
    }

    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
    let manifest: VersionManifest = reqwest::blocking::get(url)?.json()?;

    let version = match manifest
        .versions
        .iter()
        .find(|v| v.version_type == "release")
    {
        Some(v) => v,
        None => {
            println!("Release sürüm bulunamadı.");
            return Ok(());
        }
    };

    println!("Sürüm: {}", version.id);
    let details: VersionDetails = reqwest::blocking::get(&version.url)?.json()?;

    let needed: Vec<&Library> = details
        .libraries
        .iter()
        .filter(|lib| applies_to_current_os(&lib.rules))
        .collect();

    println!(
        "Toplam kütüphane: {}, senin OS'ta gerekli: {}\n",
        details.libraries.len(),
        needed.len()
    );

    for lib in needed {
        if let Some(artifact) = &lib.downloads.artifact {
            let full_path = format!("libraries/{}", artifact.path);

            if !Path::new(&full_path).exists() {
                if let Some(parent_dir) = Path::new(&full_path).parent() {
                    fs::create_dir_all(parent_dir)?;
                }
                println!("[indiriliyor] {} ({} KB)", lib.name, artifact.size / 1024);
                let bytes = reqwest::blocking::get(&artifact.url)?.bytes()?;
                fs::write(&full_path, &bytes)?;
            } else {
                println!("[atlandı] {}", lib.name);
            }

            if is_our_native_library(&lib.name) {
                println!("  -> natives çıkarılıyor: {}", lib.name);
                extract_natives(&full_path, "natives")?;
            }
        }
    }

    println!("\nBitti.");
    Ok(())
}
