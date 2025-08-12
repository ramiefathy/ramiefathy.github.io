#Tutorial for site creation
#http://nickstrayer.me/RMarkdown_Sites_tutorial/

library("rmarkdown")

# Determine repository root relative to this script's directory
get_script_dir <- function() {
  # When run via Rscript, commandArgs contains the --file argument
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- "--file="
  match <- grep(file_arg, args)
  if (length(match) > 0) {
    return(normalizePath(dirname(sub(file_arg, "", args[match]))))
  }
  # Fallbacks for interactive sessions
  if (!is.null(sys.frames()) && length(sys.frames()) > 0) {
    ofile <- tryCatch(sys.frames()[[1]]$ofile, error = function(e) NULL)
    if (!is.null(ofile)) {
      return(normalizePath(dirname(ofile)))
    }
  }
  # As a last resort, assume current working directory
  return(normalizePath(getwd()))
}

script_dir <- get_script_dir()
repo_root <- normalizePath(file.path(script_dir, ".."))
setwd(repo_root)

rmarkdown::render_site()
