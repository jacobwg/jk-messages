module ApplicationHelper
  def page_title title=''
    content_for(:page_title, title) unless title.nil?
    @out ||= content_for(:page_title).blank? ? 'J&amp;K Messages'.html_safe : "#{content_for(:page_title)} - J&amp;K Messages".html_safe
  end
end
