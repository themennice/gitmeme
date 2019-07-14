import * as React from "./lib/react";
import { Token } from "./parseTokens";
import * as getCaretCoordinates from "textarea-caret";
import * as ReactDOM from "./lib/react-dom";
import searcher from "./searcher";
import TokenTag from "./components/TokenTag";

const TAG_CONTAINER_ID = "__tagContainer";
const TEXT_HEIGHT = 18;

export interface TokenTagType {
  caretIsAtToken: boolean;
  reposition: Function;
  input: Element;
  isValid: boolean;
  token: Token;
  remove: Function;
  imageUrl: string | null;
  imageUrls: Array<string>;
  disabled: boolean;
  position: {
    top: number;
    left: number;
    width: number;
  };
}

// let removeOpenImage = null;

const preferredTagUrls = {};

export default function createTokenTag(
  textInput: HTMLInputElement,
  token: Token,
  onTokenActive: (isActive: boolean, tokenTag: TokenTagType) => void
): TokenTagType {
  console.log("createTokenTag", token.value);
  const startCoords = getCaretCoordinates(textInput, token.index);
  const endCoords = getCaretCoordinates(
    textInput,
    token.index + token.value.length + 1
  );
  let caretIsAtToken = false;

  let tagContainer = document.getElementById(TAG_CONTAINER_ID);
  if (!tagContainer) {
    tagContainer = document.createElement("div");
    tagContainer.id = TAG_CONTAINER_ID;
    document.body.appendChild(tagContainer);
  }

  const tagUi = document.createElement("div");
  tagContainer.appendChild(tagUi);

  function renderTag() {
    console.log("renderTag record.disabled = ", record.disabled);
    ReactDOM.render(
      <TokenTag
        isDisabled={record.disabled}
        caretActive={record.caretIsAtToken}
        selectedImage={record.imageUrl}
        images={record.imageUrls}
        token={token}
        position={record.position}
        modalIsOpen={record.modalIsOpen}
        onSelectImage={(url: string) => {
          record.imageUrl = url;
          preferredTagUrls[token.value] = url;
          renderTag();
        }}
        onToggleDisabled={() => {
          record.disabled = !record.disabled;
          if (record.disabled) {
            record.modalIsOpen = false;
          }
          renderTag();
        }}
        onToggleModal={() => {
          record.modalIsOpen = !record.modalIsOpen;
          renderTag();
        }}
      />,
      tagUi
    );
  }

  function checkCaretPosition() {
    const caretPosition = textInput.selectionStart;
    const nextCaretIsAtToken =
      caretPosition >= token.index &&
      caretPosition <= token.index + token.value.length + 1;

    if (nextCaretIsAtToken !== caretIsAtToken) {
      setTimeout(() => {
        onTokenActive(nextCaretIsAtToken, record);
      });
    }

    record.caretIsAtToken = caretIsAtToken = nextCaretIsAtToken;

    renderTag();
    // setTagUiTitle();
  }

  function reposition() {
    const rect = textInput.getBoundingClientRect();
    const top = TEXT_HEIGHT + window.scrollY + rect.top + startCoords.top;
    const left = window.scrollX + rect.left + startCoords.left;

    record.position = {
      top,
      left,
      width: endCoords.left - startCoords.left
    };

    renderTag();
  }

  function remove() {
    tagUi.parentNode.removeChild(tagUi);
    textInput.removeEventListener("keyup", checkCaretPosition);
    textInput.removeEventListener("keydown", handleInputKey, true);
    textInput.removeEventListener("click", handleInputClick);
    // removeImage();
  }

  function handleInputKey(evt) {
    if (evt.keyCode === 40) {
      if (record.caretIsAtToken) {
        if (!record.modalIsOpen) {
          // Down arrow
          evt.preventDefault();
          evt.stopPropagation();
          record.modalIsOpen = true;
          renderTag();
          return false;
        }
      }
    }
    if (record.modalIsOpen) {
      record.modalIsOpen = false;
      renderTag();
    }
    return true;
  }

  function handleInputClick(evt) {
    if (record.modalIsOpen) {
      record.modalIsOpen = false;
      renderTag();
    }
    checkCaretPosition();
  }

  const existingPreferredImageUrl = preferredTagUrls[token.value] || null;

  const record = {
    caretIsAtToken: false,
    modalIsOpen: false,
    input: textInput,
    remove,
    reposition,
    token,
    isValid: existingPreferredImageUrl ? true : false,
    imageUrl: existingPreferredImageUrl,
    imageUrls: [],
    disabled: false,
    position: { top: 0, left: 0, width: 0 }
  };

  reposition();
  checkCaretPosition();
  textInput.addEventListener("keyup", checkCaretPosition);
  textInput.addEventListener("keydown", handleInputKey, true);
  textInput.addEventListener("click", handleInputClick);

  renderTag();

  searcher(token.value).then((urls: Array<string>) => {
    const url = urls.length > 0 ? urls[0] : null;

    record.imageUrl = record.imageUrl || url;
    record.imageUrls = urls;
    record.isValid = !!url;

    renderTag();
  });

  return record;
}

// function disableImage() {
//   record.disabled = true;
//   removeImage();
// }

// function selectImage() {
//   const wrapper = document.createElement("div");
//   wrapper.className = "__imageSelector";

//   wrapper.innerHTML = `
//     <div class="__imageSelectorTitle">Choose One Image</div>
//       ${record.imageUrls
//         .map((url, idx) => {
//           return `<a href="#" data-index="${idx}"><img src="${url}" /></a>`;
//         })
//         .join("\n")}
//   `;
//   tagContainer.appendChild(wrapper);
//   wrapper.addEventListener("click", evt => {
//     let target = evt.target as HTMLElement;
//     let targetName = target.tagName.toLowerCase();
//     if (targetName === "img") {
//       target = target.parentElement;
//       targetName = target.tagName.toLowerCase();
//     }
//     if (targetName === "a") {
//       record.imageUrl = record.imageUrls[target.getAttribute("data-index")];
//       preferredTagUrls[record.token.value] = record.imageUrl;
//       updateTagUi();
//     }

//     tagContainer.removeChild(wrapper);
//   });
// }

// function openImageUI() {
//   // If a url exists, then show the image in thumbnail form.
//   // If the url does not exist, open a typeahead to find the
//   // image you want (laterz...)

//   if (record.imageUrl) {
//     if (imageUi) {
//       removeImage();
//     } else {
//       if (removeOpenImage) {
//         removeOpenImage();
//       }
//       imageUi = document.createElement("div");

//       imageUi.className = "__tokenTagModal";
//       tagUi.classList.add("__isOpen");

//       const imagesContainer = document.createElement("div");
//       imagesContainer.className = "__tokenTagModalImages";

//       const imageNode = document.createElement("img");
//       imageNode.src = record.imageUrl;

//       imagesContainer.appendChild(imageNode);

//       const removeButtonNode = document.createElement("button");
//       removeButtonNode.textContent = record.disabled
//         ? "Enable Tag"
//         : "Disable Tag";

//       const buttonContainer = document.createElement("div");
//       buttonContainer.className = "__tokenTagModalButtons";

//       buttonContainer.appendChild(removeButtonNode);

//       imageUi.appendChild(imagesContainer);
//       imageUi.appendChild(buttonContainer);

//       imageNode.addEventListener("click", removeImage);
//       removeButtonNode.addEventListener(
//         "click",
//         record.disabled ? enableImage : disableImage
//       );

//       const showAllImagesNode = document.createElement("button");
//       showAllImagesNode.className = "__showAllImages";
//       showAllImagesNode.textContent = `+${record.imageUrls.length - 1}`;
//       showAllImagesNode.addEventListener("click", selectImage);
//       imageUi.appendChild(showAllImagesNode);

//       updateTagUi();

//       tagContainer.appendChild(imageUi);

//       // Store the global reference to ensure that only one image is
//       // open at a time
//       removeOpenImage = removeImage;

//       reposition();
//     }
//   }
// }